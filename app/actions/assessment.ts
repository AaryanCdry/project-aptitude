'use server';

import { createClient } from '@/lib/supabase/server';
import { nextLevel, checkpointCap, questionTimer } from '@/lib/adaptive';

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

export async function fetchNextQuestion(testId: string) {
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

  // Build per-domain adaptive state from attempt history
  const domainLevels: Record<string, number> = {};
  const domainStreakCorrect: Record<string, number> = {};
  const domainStreakWrong: Record<string, number> = {};
  const domainCount: Record<string, number> = {};

  for (const attempt of attempts ?? []) {
    const q: any = Array.isArray(attempt.questions) ? attempt.questions[0] : attempt.questions;
    const domain: string = q?.domain ?? 'GENERAL';
    if (domainLevels[domain] === undefined) domainLevels[domain] = 3;
    if (domainStreakCorrect[domain] === undefined) domainStreakCorrect[domain] = 0;
    if (domainStreakWrong[domain] === undefined) domainStreakWrong[domain] = 0;
    domainCount[domain] = (domainCount[domain] ?? 0) + 1;

    if (attempt.is_correct) {
      domainStreakCorrect[domain]++;
      domainStreakWrong[domain] = 0;
    } else {
      domainStreakWrong[domain]++;
      domainStreakCorrect[domain] = 0;
    }

    domainLevels[domain] = nextLevel(
      domainLevels[domain],
      domainStreakCorrect[domain],
      domainStreakWrong[domain],
    );
  }

  // Apply checkpoint cap so no domain races too far ahead of others
  for (const domain of Object.keys(domainLevels)) {
    const cap = checkpointCap(domainLevels, domain);
    domainLevels[domain] = Math.min(domainLevels[domain], cap);
  }

  // Discover available domains from the questions bank
  const { data: sampleQ } = await supabase.from('questions').select('domain').limit(200);
  const availableDomains = [
    ...new Set((sampleQ ?? []).map((q: any) => q.domain).filter(Boolean)),
  ] as string[];

  // Pick the least-attempted domain to ensure broad coverage
  let targetDomain: string | null = null;
  let targetLevel = 3;

  if (availableDomains.length > 0) {
    let minCount = Infinity;
    for (const d of availableDomains) {
      const count = domainCount[d] ?? 0;
      if (count < minCount) {
        minCount = count;
        targetDomain = d;
      }
    }
    targetLevel = domainLevels[targetDomain!] ?? 3;
  }

  const answeredIds = (attempts ?? []).map(a => a.question_id);

  // Primary query: target domain + adaptive difficulty
  let query = supabase.from('questions').select('*').eq('difficulty', targetLevel).limit(10);
  if (targetDomain) query = (query as any).eq('domain', targetDomain);
  if (answeredIds.length > 0) query = (query as any).not('id', 'in', `(${answeredIds.join(',')})`);

  const { data: candidates } = await query;
  let pool: any[] = candidates ?? [];

  // Fallback 1: same domain, any difficulty
  if (pool.length === 0 && targetDomain) {
    let fbQ = supabase.from('questions').select('*').eq('domain', targetDomain).limit(10);
    if (answeredIds.length > 0) fbQ = (fbQ as any).not('id', 'in', `(${answeredIds.join(',')})`);
    const { data: fb } = await fbQ;
    pool = fb ?? [];
  }

  // Fallback 2: any unanswered question
  if (pool.length === 0) {
    let fbQ = supabase.from('questions').select('*').limit(5);
    if (answeredIds.length > 0) fbQ = (fbQ as any).not('id', 'in', `(${answeredIds.join(',')})`);
    const { data: fb } = await fbQ;
    pool = fb ?? [];
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

  // Verify correct answer
  const { data: question } = await supabase
    .from('questions')
    .select('correct_answer')
    .eq('id', questionId)
    .single();

  if (!question) throw new Error('Question not found');

  const isCorrect = question.correct_answer === selectedAnswer;

  const { error } = await supabase
    .from('test_attempts')
    .insert({
      test_id: testId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
    });

  if (error) throw error;
  
  return { success: true, isCorrect };
}

export async function finishTest(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase
    .from('tests')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', testId);

  const { data: attempts } = await supabase
    .from('test_attempts')
    .select(`
      is_correct,
      selected_answer,
      questions (
        text,
        options,
        correct_answer,
        explanation,
        domain
      )
    `)
    .eq('test_id', testId);

  const correctCount = attempts ? attempts.filter(a => a.is_correct).length : 0;
  const total = attempts ? attempts.length : 0;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  if (user) {
    // Aggregate per-domain results and save one row per domain
    const domainResults: Record<string, { correct: number; total: number }> = {};
    for (const attempt of attempts ?? []) {
      const q: any = Array.isArray(attempt.questions) ? attempt.questions[0] : attempt.questions;
      const domain: string = q?.domain ?? 'QUANTITATIVE';
      if (!domainResults[domain]) domainResults[domain] = { correct: 0, total: 0 };
      domainResults[domain].total++;
      if (attempt.is_correct) domainResults[domain].correct++;
    }

    const domainRows = Object.entries(domainResults).map(([domain, { correct, total: dt }]) => ({
      student_id: user.id,
      test_id: testId,
      domain,
      score: dt > 0 ? Math.round((correct / dt) * 100) : 0,
      percentile: 50.0,
    }));

    // Always store the true overall score so the dashboard can display it accurately
    const overallRow = {
      student_id: user.id,
      test_id: testId,
      domain: 'OVERALL',
      score: scorePercent,
      percentile: 50.0,
    };

    await supabase.from('scores').insert(
      domainRows.length > 0 ? [...domainRows, overallRow] : [overallRow]
    );
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

  // Fetch overall score
  const { data: scoreData } = await supabase
    .from('scores')
    .select('*')
    .eq('test_id', testId)
    .single();

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
