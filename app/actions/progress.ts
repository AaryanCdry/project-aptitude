'use server';

import { createClient } from '@/lib/supabase/server';

// ─── Student domain progress over time ──────────────────────────────────────
export async function getStudentProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // All scores grouped by domain + time
  const { data: scores } = await supabase
    .from('scores')
    .select('domain, score, percentile, created_at, tests!student_id(type)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: true });

  // Domain progress levels
  const { data: domainLevels } = await supabase
    .from('domain_progress')
    .select('domain, level, updated_at')
    .eq('student_id', user.id);

  // Full test history
  const { data: tests } = await supabase
    .from('tests')
    .select('id, type, status, created_at, completed_at, scores(domain, score, percentile)')
    .eq('student_id', user.id)
    .eq('status', 'COMPLETED')
    .order('created_at', { ascending: false })
    .limit(20);

  // Build domain summary
  const domainMap: Record<string, { scores: number[]; percentiles: number[] }> = {};
  (scores ?? []).forEach((s: any) => {
    if (!domainMap[s.domain]) domainMap[s.domain] = { scores: [], percentiles: [] };
    domainMap[s.domain].scores.push(s.score);
    if (s.percentile != null) domainMap[s.domain].percentiles.push(s.percentile);
  });

  const domainSummary = Object.entries(domainMap).map(([domain, data]) => {
    const latest = data.scores[data.scores.length - 1] ?? 0;
    const first = data.scores[0] ?? 0;
    const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
    const avgPct = data.percentiles.length
      ? Math.round(data.percentiles.reduce((a, b) => a + b, 0) / data.percentiles.length)
      : 0;
    const level = domainLevels?.find((l: any) => l.domain === domain)?.level ?? 1;
    const delta = latest - first;
    return { domain, latest, avg, avgPct, level, delta, history: data.scores };
  });

  // Improvement delta (overall)
  const allScores = (scores ?? []).map((s: any) => s.score);
  const overallAvg = allScores.length
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  return {
    domainSummary,
    overallAvg,
    totalTests: (tests ?? []).length,
    testHistory: (tests ?? []).map((t: any) => ({
      id: t.id,
      type: t.type,
      date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      scores: t.scores ?? [],
      avgScore: t.scores?.length
        ? Math.round(t.scores.reduce((a: number, b: any) => a + b.score, 0) / t.scores.length)
        : 0,
    })),
  };
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export async function getLeaderboard(period: 'weekly' | 'monthly' | 'all' = 'all') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const now = new Date();
  let cutoff: string | undefined;
  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    cutoff = d.toISOString();
  } else if (period === 'monthly') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    cutoff = d.toISOString();
  }

  let query = supabase
    .from('scores')
    .select('student_id, score, domain, percentile, created_at, users!student_id(id, name, email)');

  if (cutoff) query = query.gte('created_at', cutoff);

  const { data: scores } = await query;

  // Aggregate by student
  const studentMap: Record<string, { name: string; email: string; total: number; count: number; percentiles: number[] }> = {};
  (scores ?? []).forEach((s: any) => {
    const sid = s.student_id;
    if (!studentMap[sid]) {
      studentMap[sid] = {
        name: s.users?.name ?? 'Unknown',
        email: s.users?.email ?? '',
        total: 0,
        count: 0,
        percentiles: [],
      };
    }
    studentMap[sid].total += s.score;
    studentMap[sid].count += 1;
    if (s.percentile != null) studentMap[sid].percentiles.push(s.percentile);
  });

  const ranked = Object.entries(studentMap)
    .map(([id, data]) => ({
      id,
      name: data.name,
      email: data.email,
      avgScore: Math.round(data.total / data.count),
      testsCount: data.count,
      avgPercentile: data.percentiles.length
        ? Math.round(data.percentiles.reduce((a, b) => a + b, 0) / data.percentiles.length)
        : 0,
      isCurrentUser: id === user.id,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const currentUserRank = ranked.find(r => r.isCurrentUser);

  return { ranked, currentUserRank };
}
