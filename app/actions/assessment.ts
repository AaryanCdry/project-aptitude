'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stepLevel, questionTimer, computeWeightedScore, testTotalPoints } from '@/lib/adaptive';

const TOTAL_QUESTIONS_PER_TEST = 25;

export async function getOrCreateActiveTest() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check for an IN_PROGRESS test
  const { data: existingTest } = await supabase
    .from('tests')
    .select('*')
    .eq('student_id', user.id)
    .eq('status', 'IN_PROGRESS')
    .single();

  if (existingTest) {
    return existingTest;
  }

  // Create a new test if none exists
  const { data: newTest, error: insertError } = await supabase
    .from('tests')
    .insert({
      student_id: user.id,
      type: 'SELF',
      status: 'IN_PROGRESS',
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return newTest;
}

export async function fetchNextQuestion(testId: string, domainFilter?: string | null) {
  const supabase = await createClient();

  const { data: attempts, error: attemptsError } = await supabase
    .from('test_attempts')
    .select('question_id, is_correct, questions(difficulty, domain)')
    .eq('test_id', testId)
    .order('created_at', { ascending: true });

  if (attemptsError) throw attemptsError;

  if ((attempts?.length ?? 0) >= TOTAL_QUESTIONS_PER_TEST) {
    return { finished: true };
  }

  // Build a per-domain adaptive level counter from attempt history.
  // Each domain's counter starts at 1; a correct answer steps it +1, a wrong −1
  // (clamped 1-10). This is an abstract target — the actual question served is
  // the nearest difficulty the bank offers, so the counter keeps climbing even
  // when intermediate difficulties are missing from the question bank.
  const domainLevels: Record<string, number> = {};
  const domainCount: Record<string, number> = {};

  for (const attempt of attempts ?? []) {
    const q: any = Array.isArray(attempt.questions) ? attempt.questions[0] : attempt.questions;
    const domain: string = q?.domain ?? 'GENERAL';
    if (domainLevels[domain] === undefined) domainLevels[domain] = 1;
    domainCount[domain] = (domainCount[domain] ?? 0) + 1;
    domainLevels[domain] = stepLevel(domainLevels[domain], !!attempt.is_correct);
  }

  // Discover available domains from the questions bank
  const { data: sampleQ } = await supabase.from('questions').select('domain').limit(200);
  const availableDomains = [
    ...new Set((sampleQ ?? []).map((q: any) => q.domain).filter(Boolean)),
  ] as string[];

  // Pick the target domain. A domain-focused drill (domainFilter) locks every
  // question to that domain; otherwise rotate to the least-attempted domain
  // for broad coverage. An unseen domain starts at level 1.
  let targetDomain: string | null = null;
  let targetLevel = 1;

  if (domainFilter && availableDomains.includes(domainFilter)) {
    targetDomain = domainFilter;
    targetLevel = domainLevels[domainFilter] ?? 1;
  } else if (availableDomains.length > 0) {
    let minCount = Infinity;
    for (const d of availableDomains) {
      const count = domainCount[d] ?? 0;
      if (count < minCount) {
        minCount = count;
        targetDomain = d;
      }
    }
    targetLevel = domainLevels[targetDomain!] ?? 1;
  }

  const answeredIds = (attempts ?? []).map(a => a.question_id);

  // From a list of questions, keep only those whose difficulty is *closest* to
  // the target level. If a level-N question exists it is used; otherwise the
  // nearest band is served (N-1, N+1, …) so the ladder never jumps to a random
  // difficulty just because the exact level has no question in the bank.
  const nearestDifficulty = (list: any[], level: number): any[] => {
    if (list.length === 0) return [];
    let best = Infinity;
    for (const q of list) best = Math.min(best, Math.abs((q.difficulty ?? 3) - level));
    return list.filter(q => Math.abs((q.difficulty ?? 3) - level) === best);
  };

  // Primary: unanswered questions in the target domain, narrowed to nearest difficulty
  let pool: any[] = [];
  if (targetDomain) {
    let dq = supabase.from('questions').select('*').eq('domain', targetDomain).limit(300);
    if (answeredIds.length > 0) dq = (dq as any).not('id', 'in', `(${answeredIds.join(',')})`);
    const { data: domainQuestions } = await dq;
    pool = nearestDifficulty(domainQuestions ?? [], targetLevel);
  }

  // Fallback: domain exhausted (or no domain) → any unanswered question, nearest difficulty
  if (pool.length === 0) {
    let aq = supabase.from('questions').select('*').limit(300);
    if (answeredIds.length > 0) aq = (aq as any).not('id', 'in', `(${answeredIds.join(',')})`);
    const { data: anyQuestions } = await aq;
    pool = nearestDifficulty(anyQuestions ?? [], targetLevel);
  }

  if (pool.length === 0) return { finished: true };

  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    question: picked,
    progress: attempts?.length ?? 0,
    total: TOTAL_QUESTIONS_PER_TEST,
    timerSeconds: questionTimer(picked.difficulty),
  };
}

export async function submitAnswer(testId: string, questionId: string, selectedAnswer: string, timeTakenMs: number) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Questions are public-readable so session client is fine here
  const { data: question } = await supabase
    .from('questions')
    .select('correct_answer, correct_index, options, explanation')
    .eq('id', questionId)
    .single();

  if (!question) throw new Error('Question not found');

  // Support both correct_index and correct_answer storage patterns
  let isCorrect = false;
  if (question.correct_index != null && Array.isArray(question.options)) {
    isCorrect = question.options[question.correct_index] === selectedAnswer;
  } else {
    isCorrect = question.correct_answer === selectedAnswer;
  }

  // Use adminClient — RLS may block student inserts on test_attempts
  const { error } = await adminClient
    .from('test_attempts')
    .insert({
      test_id: testId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
    });

  if (error) throw error;

  // Return the correct answer text and explanation so the client can show feedback
  const correctAnswerText: string =
    question.correct_index != null && Array.isArray(question.options)
      ? question.options[question.correct_index] ?? question.correct_answer ?? ''
      : question.correct_answer ?? '';

  return {
    success: true,
    isCorrect,
    correctAnswer: correctAnswerText,
    explanation: (question as any).explanation ?? null,
  };
}

export async function updateAnswer(testId: string, questionId: string, selectedAnswer: string, timeTakenMs: number) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: question } = await supabase
    .from('questions')
    .select('correct_answer, correct_index, options')
    .eq('id', questionId)
    .single();

  if (!question) throw new Error('Question not found');

  let isCorrect = false;
  if (question.correct_index != null && Array.isArray(question.options)) {
    isCorrect = question.options[question.correct_index] === selectedAnswer;
  } else {
    isCorrect = question.correct_answer === selectedAnswer;
  }

  const { error } = await adminClient
    .from('test_attempts')
    .update({ selected_answer: selectedAnswer, is_correct: isCorrect, time_taken_ms: timeTakenMs })
    .eq('test_id', testId)
    .eq('question_id', questionId);

  if (error) throw error;
  return { success: true, isCorrect };
}

function tierFromScore(score: number): 'ADVANCED' | 'INTERMEDIATE' | 'BASIC' | null {
  if (score >= 90) return 'ADVANCED';
  if (score >= 80) return 'INTERMEDIATE';
  if (score >= 70) return 'BASIC';
  return null;
}

export async function finishTest(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminClient = createAdminClient();

  // Fetch test type before marking complete (so we can detect FINAL)
  const { data: testRow } = await adminClient
    .from('tests')
    .select('type, student_id')
    .eq('id', testId)
    .single();

  // Use adminClient for all writes — RLS blocks student mutations
  await adminClient
    .from('tests')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', testId);

  const { data: attempts } = await adminClient
    .from('test_attempts')
    .select(`
      is_correct,
      selected_answer,
      time_taken_ms,
      questions (
        text,
        options,
        correct_answer,
        explanation,
        domain,
        difficulty
      )
    `)
    .eq('test_id', testId);

  // Normalize for the scoring engine
  const attemptRows = (attempts ?? []).map(a => {
    const q: any = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    return {
      difficulty: q?.difficulty ?? 3,
      domain: (q?.domain ?? 'QUANTITATIVE') as string,
      isCorrect: !!a.is_correct,
      timeTakenMs: a.time_taken_ms ?? 0,
    };
  });

  const scorePercent = computeWeightedScore(attemptRows);

  if (user) {
    // Per-domain weighted scores (each domain scored independently with the same formula)
    const domainGroups: Record<string, typeof attemptRows> = {};
    for (const row of attemptRows) {
      if (!domainGroups[row.domain]) domainGroups[row.domain] = [];
      domainGroups[row.domain].push(row);
    }

    const domainRows = Object.entries(domainGroups).map(([domain, rows]) => ({
      student_id: user.id,
      test_id: testId,
      domain,
      score: computeWeightedScore(rows),
      percentile: 50.0,
    }));

    const overallRow = {
      student_id: user.id,
      test_id: testId,
      domain: 'OVERALL',
      score: scorePercent,
      percentile: 50.0,
    };

    // Use adminClient — RLS blocks student inserts on the scores table
    await adminClient.from('scores').insert(
      domainRows.length > 0 ? [...domainRows, overallRow] : [overallRow]
    );

    // Auto-issue tier-based certificate when this is a FINAL exam
    let certGranted = false;
    if (testRow?.type === 'FINAL') {
      const tier = tierFromScore(scorePercent);
      if (tier) {
        const qrCode = `CERT-${testId}-${Date.now().toString(36)}`.toUpperCase();
        await adminClient.from('certificates').insert({
          student_id: user.id,
          issued_by: user.id,        // auto-issued (system) — no human approver
          qr_code: qrCode,
          tier,
          revoked: false,
        });
        certGranted = true;
      }
    }

    // Advance student_level (+1 if any high-difficulty answered correctly, +2 on cert)
    // and add this test's points to the running total.
    const advancedHits = attemptRows.filter(r => r.isCorrect && r.difficulty >= 4).length;
    const levelBump = (advancedHits > 0 ? 1 : 0) + (certGranted ? 2 : 0);
    const testPoints = testTotalPoints(attemptRows);

    const { data: profile } = await adminClient
      .from('users')
      .select('student_level, total_points')
      .eq('id', user.id)
      .single();
    await adminClient
      .from('users')
      .update({
        student_level: (profile?.student_level ?? 0) + levelBump,
        total_points: (profile?.total_points ?? 0) + testPoints,
      })
      .eq('id', user.id);
  }

  return { score: scorePercent, attempts };
}

export async function getTestResultDetails(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch test details
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (testError || !test) throw new Error('Test not found');

  // Fetch the OVERALL score row (a test has one row per domain + one OVERALL row,
  // so .single() on test_id alone would fail — filter to OVERALL)
  const { data: scoreData } = await supabase
    .from('scores')
    .select('*')
    .eq('test_id', testId)
    .eq('domain', 'OVERALL')
    .maybeSingle();

  // Fetch attempts with question details
  const { data: attempts } = await supabase
    .from('test_attempts')
    .select(`
      id,
      is_correct,
      selected_answer,
      time_taken_ms,
      questions (
        id,
        text,
        options,
        correct_answer,
        explanation,
        difficulty,
        domain
      )
    `)
    .eq('test_id', testId)
    .order('created_at', { ascending: true });

  return { test, score: scoreData, attempts };
}
