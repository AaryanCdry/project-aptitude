'use server';

import { createClient } from '@/lib/supabase/server';

export async function getStudentDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch all completed tests for this user
  const { data: tests } = await supabase
    .from('tests')
    .select('*, scores(*)')
    .eq('student_id', user.id)
    .eq('status', 'COMPLETED')
    .order('completed_at', { ascending: true }); // ascending for chart

  if (!tests) return { tests: [], domainScores: [], averageScore: 0, totalTests: 0, scoreTrend: [] };

  // Calculate domain averages
  const domainTotals: Record<string, { total: number; count: number }> = {};
  let totalScore = 0;
  let scoreCount = 0;

  tests.forEach((test: any) => {
    if (test.scores && test.scores.length > 0) {
      test.scores.forEach((scoreRecord: any) => {
        const domain = scoreRecord.domain;
        if (!domainTotals[domain]) {
          domainTotals[domain] = { total: 0, count: 0 };
        }
        domainTotals[domain].total += scoreRecord.score;
        domainTotals[domain].count += 1;
        totalScore += scoreRecord.score;
        scoreCount += 1;
      });
    }
  });

  const domainScores = Object.entries(domainTotals).map(([domain, data]) => ({
    domain,
    average: Math.round(data.total / data.count)
  }));

  const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  // Build score trend from last 5 completed tests (each test's first score record)
  const scoreTrend = tests
    .slice(-5)
    .map((test: any, i: number) => ({
      label: `T${i + 1}`,
      score: test.scores?.[0]?.score ?? 0,
    }));

  return {
    tests: [...tests].reverse(), // most-recent first for the activity list
    domainScores,
    averageScore,
    totalTests: tests.length,
    scoreTrend,
  };
}

export async function getAdminDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { count: totalStudents } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT');

  const { count: totalCompletedTests } = await supabase
    .from('tests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'COMPLETED');

  const { data: scores } = await supabase
    .from('scores')
    .select('score, domain, created_at, student_id, users!student_id(id, name)');

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
