'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function getStudentDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Use adminClient for table reads — RLS on the embedded scores resource can
  // silently return an empty array, leaving the dashboard with no domain data.
  const adminClient = createAdminClient();

  const { data: studentProfile } = await adminClient
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();

  // Fetch all completed tests for this user (with their per-domain + OVERALL scores)
  const { data: tests } = await adminClient
    .from('tests')
    .select('*, scores(*)')
    .eq('student_id', user.id)
    .eq('status', 'COMPLETED')
    .order('completed_at', { ascending: true }); // ascending for chart

  if (!tests) return { tests: [], domainScores: [], averageScore: 0, totalTests: 0, scoreTrend: [], collegeId: studentProfile?.college_id ?? null };

  // Helper: find the true overall score for a test (OVERALL domain row, or fallback average)
  function testOverallScore(scores: any[]): number {
    if (!scores || scores.length === 0) return 0;
    const overall = scores.find((s: any) => s.domain === 'OVERALL');
    if (overall) return overall.score;
    // Fallback for tests saved before OVERALL row was introduced
    return Math.round(scores.reduce((sum: number, s: any) => sum + s.score, 0) / scores.length);
  }

  const domainTotals: Record<string, { total: number; count: number }> = {};
  let totalScore = 0;
  let scoreCount = 0;

  tests.forEach((test: any) => {
    if (test.scores && test.scores.length > 0) {
      // Use the true overall score for the per-test average, not domain rows
      const overall = testOverallScore(test.scores);
      if (overall > 0) { totalScore += overall; scoreCount++; }

      // Domain aggregation — exclude the synthetic OVERALL row
      test.scores
        .filter((s: any) => s.domain !== 'OVERALL')
        .forEach((scoreRecord: any) => {
          const domain = scoreRecord.domain;
          if (!domainTotals[domain]) domainTotals[domain] = { total: 0, count: 0 };
          domainTotals[domain].total += scoreRecord.score;
          domainTotals[domain].count += 1;
        });
    }
  });

  const domainScores = Object.entries(domainTotals).map(([domain, data]) => ({
    domain,
    average: Math.round(data.total / data.count),
  }));

  const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  const scoreTrend = tests
    .slice(-5)
    .map((test: any, i: number) => ({
      label: `T${i + 1}`,
      score: testOverallScore(test.scores ?? []),
    }));

  // Attach overallScore to each test so the page doesn't need to re-derive it
  const testsWithScore = tests.map((test: any) => ({
    ...test,
    overallScore: testOverallScore(test.scores ?? []),
  }));

  return {
    tests: [...testsWithScore].reverse(), // most-recent first for the activity list
    domainScores,
    averageScore,
    totalTests: tests.length,
    scoreTrend,
    collegeId: studentProfile?.college_id ?? null,
  };
}

export async function getAdminDashboardData() {
  const { getCallerScope } = await import('./scope');
  const scope = await getCallerScope();
  if (!scope.userId) throw new Error('Not authenticated');

  // adminClient bypasses RLS (HODs are not is_admin() so the session client
  // returns nothing); scope the student set to the college, or to the
  // department when the caller is a HOD (SUB_ADMIN).
  const adminClient = createAdminClient();

  let studentsQ = adminClient
    .from('users')
    .select('id')
    .eq('role', 'STUDENT');
  if (scope.collegeId) studentsQ = studentsQ.eq('college_id', scope.collegeId);
  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    studentsQ = studentsQ.eq('department_id', scope.departmentId);
  }
  const { data: scopedStudents } = await studentsQ;
  const collegeStudentIds = (scopedStudents ?? []).map((s: any) => s.id);
  const totalStudents = collegeStudentIds.length;

  const testsFilter = adminClient.from('tests').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
  const { count: totalCompletedTests } = collegeStudentIds.length
    ? await (testsFilter as any).in('student_id', collegeStudentIds)
    : { count: 0 };

  const { data: scores } = collegeStudentIds.length
    ? await adminClient
        .from('scores')
        .select('score, domain, created_at, student_id, users!student_id(id, name)')
        .in('student_id', collegeStudentIds)
    : { data: [] };

  let averageScore = 0;
  const domainTotals: Record<string, { total: number; count: number }> = {};
  const studentTotals: Record<string, { name: string; total: number; count: number }> = {};

  // Build weekly performance trend (last 5 weeks)
  const weeklyTotals: Record<string, { total: number; count: number }> = {};
  const now = new Date();

  if (scores && scores.length > 0) {
    let totalScore = 0;

    scores.forEach((s: any) => {
      totalScore += s.score;

      // Domain aggregation
      if (!domainTotals[s.domain]) domainTotals[s.domain] = { total: 0, count: 0 };
      domainTotals[s.domain].total += s.score;
      domainTotals[s.domain].count += 1;

      // Student aggregation
      if (s.users) {
        const sid = s.users.id;
        if (!studentTotals[sid]) studentTotals[sid] = { name: s.users.name || 'Unknown', total: 0, count: 0 };
        studentTotals[sid].total += s.score;
        studentTotals[sid].count += 1;
      }

      // Weekly aggregation
      const createdAt = new Date(s.created_at);
      const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const weekNum = Math.floor(diffDays / 7); // 0 = this week, 1 = last week…
      if (weekNum < 5) {
        const key = `W${4 - weekNum}`;
        if (!weeklyTotals[key]) weeklyTotals[key] = { total: 0, count: 0 };
        weeklyTotals[key].total += s.score;
        weeklyTotals[key].count += 1;
      }
    });

    averageScore = Math.round(totalScore / scores.length);
  }

  const domainAverages = Object.entries(domainTotals).map(([domain, data]) => ({
    domain,
    average: Math.round((data.total / data.count) * 10) / 10,
  }));

  const studentAverages = Object.entries(studentTotals)
    .map(([id, data]) => ({
      id,
      name: data.name,
      average: Math.round((data.total / data.count) * 10) / 10,
    }))
    .sort((a, b) => a.average - b.average);

  const studentsAtRisk = studentAverages.slice(0, 3);
  const topPerformers = studentAverages.slice(-3).reverse();

  // Produce sorted weekly trend array (W0 → W4)
  const weeklyTrend = ['W0', 'W1', 'W2', 'W3', 'W4'].map((key) => ({
    label: key,
    average: weeklyTotals[key]
      ? Math.round(weeklyTotals[key].total / weeklyTotals[key].count)
      : 0,
  }));

  return {
    totalStudents: totalStudents || 0,
    totalCompletedTests: totalCompletedTests || 0,
    averageScore,
    domainAverages,
    studentsAtRisk,
    topPerformers,
    weeklyTrend,
  };
}
