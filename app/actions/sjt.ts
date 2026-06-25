'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canViewStudent } from './scope';

const TOTAL_SJT_QUESTIONS = 20;

export async function createSjtTest() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from('tests')
    .select('*')
    .eq('student_id', user.id)
    .eq('type', 'SJT')
    .eq('status', 'IN_PROGRESS')
    .maybeSingle();

  if (existing) {
    const isExpired = existing.expires_at && new Date(existing.expires_at) < new Date();
    if (!existing.expires_at || isExpired) {
      const expires_at = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      await adminClient.from('tests').update({ expires_at }).eq('id', existing.id);
      return { testId: existing.id, expires_at };
    }
    return { testId: existing.id, expires_at: existing.expires_at };
  }

  const { data: newTest, error } = await adminClient
    .from('tests')
    .insert({
      student_id: user.id,
      type: 'SJT',
      status: 'IN_PROGRESS',
      expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return { testId: newTest.id, expires_at: newTest.expires_at };
}

export async function fetchNextSjtQuestion(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  const { data: testRow } = await adminClient
    .from('tests')
    .select('expires_at, student_id')
    .eq('id', testId)
    .single();

  if (!testRow || testRow.student_id !== user.id) throw new Error('Not authorized');

  if (testRow?.expires_at && new Date(testRow.expires_at) < new Date()) {
    return { finished: true };
  }

  const { data: attempts } = await adminClient
    .from('test_attempts')
    .select('question_id')
    .eq('test_id', testId);

  const answeredIds = (attempts ?? []).map((a: any) => a.question_id as string);

  const { count: totalCount } = await adminClient
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('domain', 'SJT')
    .eq('active', true);

  const effectiveTotal = Math.min(TOTAL_SJT_QUESTIONS, totalCount ?? TOTAL_SJT_QUESTIONS);

  if (answeredIds.length >= effectiveTotal) {
    return { finished: true };
  }

  // Fetch available questions for round-robin category selection
  let query = adminClient
    .from('questions')
    .select('id, sjt_category')
    .eq('domain', 'SJT')
    .eq('active', true);

  if (answeredIds.length > 0) {
    query = query.not('id', 'in', `(${answeredIds.join(',')})`) as typeof query;
  }

  const { data: available } = await query.limit(200);
  if (!available || available.length === 0) return { finished: true };

  // Count answered questions per category for round-robin
  const { data: answeredWithCat } = await adminClient
    .from('test_attempts')
    .select('questions(sjt_category)')
    .eq('test_id', testId);

  const catCounts: Record<string, number> = {};
  for (const a of answeredWithCat ?? []) {
    const q: any = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    const cat = q?.sjt_category;
    if (cat) catCounts[cat] = (catCounts[cat] ?? 0) + 1;
  }

  // Group available questions by category
  const byCategory: Record<string, string[]> = {};
  for (const q of available) {
    const cat = q.sjt_category ?? 'GENERAL';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(q.id);
  }

  // Pick the category with the lowest answered count that still has questions
  let targetCategory: string | null = null;
  let minCount = Infinity;
  for (const cat of Object.keys(byCategory)) {
    const count = catCounts[cat] ?? 0;
    if (count < minCount) {
      minCount = count;
      targetCategory = cat;
    }
  }

  const candidateIds = targetCategory ? byCategory[targetCategory] : available.map((q: any) => q.id);
  const pickedId = candidateIds[Math.floor(Math.random() * candidateIds.length)];

  const { data: question } = await adminClient
    .from('questions')
    .select('*')
    .eq('id', pickedId)
    .single();

  if (!question) return { finished: true };

  return {
    question,
    progress: answeredIds.length,
    total: effectiveTotal,
    expiresAt: testRow?.expires_at ?? null,
  };
}

export async function submitSjtAnswer(
  testId: string,
  questionId: string,
  bestIndex: number,
  worstIndex: number,
  timeTakenMs: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  const { data: test } = await adminClient
    .from('tests')
    .select('student_id, status')
    .eq('id', testId)
    .single();

  if (!test || test.student_id !== user.id) throw new Error('Not authorized');
  if (test.status !== 'IN_PROGRESS') throw new Error('Test is not in progress');

  const { error } = await adminClient
    .from('test_attempts')
    .insert({
      test_id: testId,
      question_id: questionId,
      selected_answer: null,
      selected_best_index: bestIndex,
      selected_worst_index: worstIndex,
      is_correct: null,
      time_taken_ms: timeTakenMs,
    });

  if (error) throw error;
  return { success: true };
}

export async function finishSjtTest(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  const { data: test } = await adminClient
    .from('tests')
    .select('student_id, status')
    .eq('id', testId)
    .single();

  if (!test || test.student_id !== user.id) throw new Error('Not authorized');

  if (test.status === 'COMPLETED') {
    const { data: existingRows } = await adminClient
      .from('sjt_results')
      .select('category, raw_score, max_score, percentile')
      .eq('test_id', testId);
    return {
      competencyProfile: (existingRows ?? []).map((r: any) => ({
        category: r.category as string,
        rawScore: r.raw_score as number,
        maxScore: r.max_score as number,
        percentile: (r.percentile ?? 50) as number,
      })),
    };
  }

  await adminClient
    .from('tests')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', testId);

  const { data: attempts } = await adminClient
    .from('test_attempts')
    .select(`
      selected_best_index,
      selected_worst_index,
      questions (
        sjt_category,
        sjt_best_index,
        sjt_worst_index
      )
    `)
    .eq('test_id', testId);

  const categoryBuckets: Record<string, { raw: number; max: number }> = {};

  for (const attempt of attempts ?? []) {
    const q: any = Array.isArray(attempt.questions) ? attempt.questions[0] : attempt.questions;
    if (!q) continue;
    const cat = q.sjt_category ?? 'GENERAL';
    if (!categoryBuckets[cat]) categoryBuckets[cat] = { raw: 0, max: 0 };

    categoryBuckets[cat].max += 2;
    if ((attempt as any).selected_best_index === q.sjt_best_index) categoryBuckets[cat].raw += 1;
    if ((attempt as any).selected_worst_index === q.sjt_worst_index) categoryBuckets[cat].raw += 1;
  }

  async function computePercentile(category: string, rawScore: number, maxScore: number): Promise<number> {
    if (maxScore === 0) return 50;
    const pct = Math.round((rawScore / maxScore) * 100);
    const [{ count: below }, { count: total }] = await Promise.all([
      adminClient
        .from('sjt_results')
        .select('*', { count: 'exact', head: true })
        .eq('category', category)
        .lt('raw_score', rawScore),
      adminClient
        .from('sjt_results')
        .select('*', { count: 'exact', head: true })
        .eq('category', category),
    ]);
    if (!total || total === 0) return pct;
    return Math.min(99, Math.round(((below ?? 0) / total) * 100));
  }

  const categoryRows = await Promise.all(
    Object.entries(categoryBuckets).map(async ([category, { raw, max }]) => ({
      test_id: testId,
      student_id: user?.id,
      category,
      raw_score: raw,
      max_score: max,
      percentile: await computePercentile(category, raw, max),
    }))
  );

  if (categoryRows.length > 0) {
    const { count: existingCount } = await adminClient
      .from('sjt_results')
      .select('*', { count: 'exact', head: true })
      .eq('test_id', testId);
    if (!existingCount || existingCount === 0) {
      await adminClient.from('sjt_results').insert(categoryRows);
    }
  }

  return {
    competencyProfile: categoryRows.map(({ category, raw_score, max_score, percentile }) => ({
      category,
      rawScore: raw_score,
      maxScore: max_score,
      percentile: percentile ?? 50,
    })),
  };
}

export async function getSjtResultDetails(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  const { data: test, error: testError } = await adminClient
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single();

  if (testError || !test) throw new Error('Test not found');

  if (test.student_id !== user.id) {
    const allowed = await canViewStudent(test.student_id);
    if (!allowed) throw new Error('Not authorized');
  }

  const { data: rows } = await adminClient
    .from('sjt_results')
    .select('*')
    .eq('test_id', testId)
    .order('category');

  const competencyProfile = (rows ?? []).map((r: any) => ({
    category: r.category as string,
    rawScore: r.raw_score as number,
    maxScore: r.max_score as number,
    percentile: (r.percentile ?? 50) as number,
  }));

  return { test, competencyProfile };
}
