'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canViewStudent } from './scope';

const TOTAL_PERSONALITY_QUESTIONS = 30;
const PERSONALITY_TRAITS = ['OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'NEUROTICISM'] as const;

export async function createPersonalityTest() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from('tests')
    .select('*')
    .eq('student_id', user.id)
    .eq('type', 'PERSONALITY')
    .eq('status', 'IN_PROGRESS')
    .maybeSingle();

  if (existing) {
    const isExpired = existing.expires_at && new Date(existing.expires_at) < new Date();
    if (!existing.expires_at || isExpired) {
      const expires_at = new Date(Date.now() + 35 * 60 * 1000).toISOString();
      await adminClient.from('tests').update({ expires_at }).eq('id', existing.id);
      return { testId: existing.id, expires_at };
    }
    return { testId: existing.id, expires_at: existing.expires_at };
  }

  const { data: newTest, error } = await adminClient
    .from('tests')
    .insert({
      student_id: user.id,
      type: 'PERSONALITY',
      status: 'IN_PROGRESS',
      expires_at: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return { testId: newTest.id, expires_at: newTest.expires_at };
}

export async function fetchNextPersonalityQuestion(testId: string) {
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
    .eq('domain', 'PERSONALITY')
    .eq('active', true);

  const effectiveTotal = Math.min(
    TOTAL_PERSONALITY_QUESTIONS,
    totalCount ?? TOTAL_PERSONALITY_QUESTIONS
  );

  if (answeredIds.length >= effectiveTotal) {
    return { finished: true };
  }

  let query = adminClient
    .from('questions')
    .select('*')
    .eq('domain', 'PERSONALITY')
    .eq('active', true);

  if (answeredIds.length > 0) {
    query = query.not('id', 'in', `(${answeredIds.join(',')})`) as typeof query;
  }

  const { data: pool } = await query.limit(50);
  if (!pool || pool.length === 0) return { finished: true };

  const picked = pool[Math.floor(Math.random() * pool.length)];

  return {
    question: picked,
    progress: answeredIds.length,
    total: effectiveTotal,
    expiresAt: testRow?.expires_at ?? null,
  };
}

export async function submitPersonalityAnswer(
  testId: string,
  questionId: string,
  selectedAnswer: string,
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
      selected_answer: selectedAnswer,
      is_correct: null,
      time_taken_ms: timeTakenMs,
    });

  if (error) throw error;
  return { success: true };
}

export async function finishPersonalityTest(testId: string) {
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
      .from('personality_results')
      .select('trait, raw_score, max_score, percentile')
      .eq('test_id', testId);
    return {
      traitProfile: (existingRows ?? []).map((r: any) => ({
        trait: r.trait as string,
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
      selected_answer,
      questions (
        question_type,
        personality_trait,
        trait_scores_map,
        forced_choice_opts,
        options
      )
    `)
    .eq('test_id', testId);

  const traitBuckets: Record<string, { raw: number; max: number }> = {};
  for (const trait of PERSONALITY_TRAITS) {
    traitBuckets[trait] = { raw: 0, max: 0 };
  }

  for (const attempt of attempts ?? []) {
    const q: any = Array.isArray(attempt.questions) ? attempt.questions[0] : attempt.questions;
    if (!q) continue;
    const answer = attempt.selected_answer ?? '';

    if (q.question_type === 'LIKERT') {
      const trait = q.personality_trait as string;
      if (!trait || !traitBuckets[trait]) continue;
      const value = parseInt(answer, 10);
      if (value >= 1 && value <= 5) {
        traitBuckets[trait].raw += value;
        traitBuckets[trait].max += 5;
      }
    } else if (q.question_type === 'FORCED_CHOICE') {
      const opts: Array<{ text: string; trait: string }> = q.forced_choice_opts ?? [];
      const chosen = opts.find((o) => o.text === answer);
      if (chosen && traitBuckets[chosen.trait]) {
        traitBuckets[chosen.trait].raw += 1;
        traitBuckets[chosen.trait].max += 1;
      }
    } else if (q.question_type === 'PERSONALITY_MCQ') {
      const map: Array<{ trait: string; score: number }> = q.trait_scores_map ?? [];
      const options: string[] = q.options ?? [];
      const idx = options.indexOf(answer);
      if (idx >= 0 && map[idx]) {
        const { trait, score } = map[idx];
        if (traitBuckets[trait]) {
          traitBuckets[trait].raw += score;
          traitBuckets[trait].max += 4;
        }
      }
    }
  }

  async function computePercentile(trait: string, rawScore: number, maxScore: number): Promise<number> {
    if (maxScore === 0) return 50;
    const pct = Math.round((rawScore / maxScore) * 100);
    const [{ count: below }, { count: total }] = await Promise.all([
      adminClient
        .from('personality_results')
        .select('*', { count: 'exact', head: true })
        .eq('trait', trait)
        .lt('raw_score', rawScore),
      adminClient
        .from('personality_results')
        .select('*', { count: 'exact', head: true })
        .eq('trait', trait),
    ]);
    if (!total || total === 0) return pct;
    return Math.min(99, Math.round(((below ?? 0) / total) * 100));
  }

  const traitRows = await Promise.all(
    PERSONALITY_TRAITS.map(async (trait) => {
      const { raw, max } = traitBuckets[trait];
      return {
        test_id: testId,
        student_id: user?.id,
        trait,
        raw_score: raw,
        max_score: max,
        percentile: await computePercentile(trait, raw, max),
      };
    })
  );

  const { count: existing } = await adminClient
    .from('personality_results')
    .select('*', { count: 'exact', head: true })
    .eq('test_id', testId);

  if (!existing || existing === 0) {
    await adminClient.from('personality_results').insert(traitRows);
  }

  return {
    traitProfile: traitRows.map(({ trait, raw_score, max_score, percentile }) => ({
      trait,
      rawScore: raw_score,
      maxScore: max_score,
      percentile: percentile ?? 50,
    })),
  };
}

export async function getPersonalityResultDetails(testId: string) {
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
    .from('personality_results')
    .select('*')
    .eq('test_id', testId)
    .order('created_at', { ascending: true });

  // Deduplicate by trait — keep the first (oldest) row per trait in case of double-insertion
  const seen = new Set<string>();
  const traitProfile = (rows ?? [])
    .filter((r: any) => { if (seen.has(r.trait)) return false; seen.add(r.trait); return true; })
    .map((r: any) => ({
      trait: r.trait as string,
      rawScore: r.raw_score as number,
      maxScore: r.max_score as number,
      percentile: (r.percentile ?? 50) as number,
    }));

  return { test, traitProfile };
}
