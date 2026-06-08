'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stepLevel, testTotalPoints } from '@/lib/adaptive';

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
    // Backfill expires_at for tests created before this column existed.
    if (!existingTest.expires_at) {
      const expires_at = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      await supabase.from('tests').update({ expires_at }).eq('id', existingTest.id);
      return { ...existingTest, expires_at };
    }
    return existingTest;
  }

  // Create a new test if none exists
  const { data: newTest, error: insertError } = await supabase
    .from('tests')
    .insert({
      student_id: user.id,
      type: 'SELF',
      status: 'IN_PROGRESS',
      expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return newTest;
}

// Lightweight test metadata read for routing/auth decisions outside the runner
// (e.g. the /assessment?test=<id> launcher needs to know whether to call
// startScheduledTest or startFinalExam).
export async function getTestMeta(testId: string) {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('tests')
    .select('id, type, status, student_id, assessment_id')
    .eq('id', testId)
    .single();
  return data ?? null;
}

export async function fetchNextQuestion(testId: string, domainFilter?: string | null) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: attempts, error: attemptsError } = await supabase
    .from('test_attempts')
    .select('question_id, is_correct, questions(difficulty, domain)')
    .eq('test_id', testId)
    .order('created_at', { ascending: true });

  if (attemptsError) throw attemptsError;

  // Resolve the curated pool (if any) before the exit check so we can use the
  // pool size as the effective total instead of the global TOTAL_QUESTIONS_PER_TEST.
  let curatedQuestionIds: string[] | null = null;
  let testExpiresAt: string | null = null;
  let recentlyCorrectIds: string[] = [];
  {
    const { data: testRow } = await adminClient
      .from('tests')
      .select('assessment_id, expires_at, student_id, type')
      .eq('id', testId)
      .single();
    testExpiresAt = (testRow as any)?.expires_at ?? null;
    if (testExpiresAt && new Date(testExpiresAt) < new Date()) {
      return { finished: true };
    }

    // For SELF tests: collect question IDs the student got correct in the last 10
    // completed SELF tests so we can deprioritise repeating them.
    if ((testRow as any)?.type === 'SELF' && (testRow as any)?.student_id) {
      const { data: recentTests } = await adminClient
        .from('tests')
        .select('id')
        .eq('student_id', (testRow as any).student_id)
        .eq('type', 'SELF')
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (recentTests && recentTests.length > 0) {
        const recentIds = recentTests.map((t: any) => t.id);
        const { data: correctAttempts } = await adminClient
          .from('test_attempts')
          .select('question_id')
          .in('test_id', recentIds)
          .eq('is_correct', true);
        recentlyCorrectIds = [...new Set((correctAttempts ?? []).map((a: any) => a.question_id as string))];
      }
    }

    if (testRow?.assessment_id) {
      const { data: ass } = await adminClient
        .from('cohort_assessments')
        .select('domain, question_ids')
        .eq('id', testRow.assessment_id)
        .single();
      if (ass) {
        if (Array.isArray(ass.question_ids) && ass.question_ids.length > 0) {
          curatedQuestionIds = ass.question_ids as string[];
        }
        if (!domainFilter && ass.domain) domainFilter = ass.domain as string;
      }
    }
  }

  const effectiveTotal = curatedQuestionIds ? curatedQuestionIds.length : TOTAL_QUESTIONS_PER_TEST;

  if ((attempts?.length ?? 0) >= effectiveTotal) {
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

  // Build candidate pool for a given exclusion list, trying target domain first then any domain.
  const buildPool = async (excludeIds: string[]): Promise<any[]> => {
    if (targetDomain) {
      let dq = supabase.from('questions').select('*').eq('domain', targetDomain).limit(300);
      if (curatedQuestionIds) dq = (dq as any).in('id', curatedQuestionIds);
      if (excludeIds.length > 0) dq = (dq as any).not('id', 'in', `(${excludeIds.join(',')})`);
      const { data } = await dq;
      const p = nearestDifficulty(data ?? [], targetLevel);
      if (p.length > 0) return p;
    }
    // Fallback: any domain
    let aq = supabase.from('questions').select('*').limit(300);
    if (curatedQuestionIds) aq = (aq as any).in('id', curatedQuestionIds);
    if (excludeIds.length > 0) aq = (aq as any).not('id', 'in', `(${excludeIds.join(',')})`);
    const { data } = await aq;
    return nearestDifficulty(data ?? [], targetLevel);
  };

  // Prefer questions not seen correctly in the last 10 SELF tests.
  // If the question bank is too small to satisfy that constraint, fall back to
  // only excluding the current test's already-answered questions.
  const fullExclude = recentlyCorrectIds.length > 0
    ? [...new Set([...answeredIds, ...recentlyCorrectIds])]
    : answeredIds;

  let pool = await buildPool(fullExclude);

  if (pool.length === 0 && recentlyCorrectIds.length > 0) {
    pool = await buildPool(answeredIds);
  }

  if (pool.length === 0) return { finished: true };

  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    question: picked,
    progress: attempts?.length ?? 0,
    total: effectiveTotal,
    expiresAt: testExpiresAt,
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

  const totalCount = attemptRows.length;
  const correctCount = attemptRows.filter(r => r.isCorrect).length;
  const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  if (user) {
    // Per-domain simple accuracy scores (correct / total for that domain)
    const domainGroups: Record<string, typeof attemptRows> = {};
    for (const row of attemptRows) {
      if (!domainGroups[row.domain]) domainGroups[row.domain] = [];
      domainGroups[row.domain].push(row);
    }

    // Compute real percentile: proportion of existing scores that are strictly
    // below this student's score, queried before we insert so the current test
    // doesn't skew its own ranking. Falls back to 50 when the table is empty.
    async function computePercentile(domain: string, score: number): Promise<number> {
      const [{ count: below }, { count: total }] = await Promise.all([
        adminClient.from('scores').select('*', { count: 'exact', head: true }).eq('domain', domain).lt('score', score),
        adminClient.from('scores').select('*', { count: 'exact', head: true }).eq('domain', domain),
      ]);
      if (!total || total === 0) return 50;
      return Math.min(99, Math.round(((below ?? 0) / total) * 100));
    }

    const domainRows = await Promise.all(
      Object.entries(domainGroups).map(async ([domain, rows]) => {
        const dc = rows.filter(r => r.isCorrect).length;
        const domainScore = rows.length > 0 ? Math.round((dc / rows.length) * 100) : 0;
        return {
          student_id: user.id,
          test_id: testId,
          domain,
          score: domainScore,
          percentile: await computePercentile(domain, domainScore),
        };
      }),
    );

    const overallRow = {
      student_id: user.id,
      test_id: testId,
      domain: 'OVERALL',
      score: scorePercent,
      percentile: await computePercentile('OVERALL', scorePercent),
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
        const gradeLabel = tier === 'ADVANCED' ? 'A' : tier === 'INTERMEDIATE' ? 'B' : 'C';
        const { error: certErr } = await adminClient.from('certificates').insert({
          student_id: user.id,
          issued_by: user.id,
          qr_code: qrCode,
          tier,
          grade: gradeLabel,
          combined_score: scorePercent,
          revoked: false,
        });
        if (!certErr) {
          await adminClient.from('badges').insert({
            student_id: user.id,
            test_id: testId,
            tier,
          });
          certGranted = true;
        }
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

  // Use adminClient for reads — RLS on `tests` only lets the student see their
  // own row, so the session client returns null when a viewer (Admin / HOD /
  // Mentor) drills into a student's result via the Insights link.
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const { canViewStudent } = await import('./scope');
  const adminClient = createAdminClient();

  // Fetch test details
  const { data: test, error: testError } = await adminClient
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (testError || !test) throw new Error('Test not found');

  // Authorization: caller must be the test's student or a viewer with scope.
  if (test.student_id !== user.id) {
    const allowed = await canViewStudent(test.student_id);
    if (!allowed) throw new Error('Not authorized to view this test.');
  }

  // Fetch the OVERALL score row (a test has one row per domain + one OVERALL row,
  // so .single() on test_id alone would fail — filter to OVERALL)
  const { data: scoreData } = await adminClient
    .from('scores')
    .select('*')
    .eq('test_id', testId)
    .eq('domain', 'OVERALL')
    .maybeSingle();

  // Fetch attempts with question details
  const { data: attempts } = await adminClient
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
