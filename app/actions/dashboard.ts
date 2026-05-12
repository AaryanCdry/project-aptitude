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
    .order('completed_at', { ascending: false });

  if (!tests) return { tests: [], domainScores: [], averageScore: 0, totalTests: 0 };

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

  return {
    tests,
    domainScores,
    averageScore,
    totalTests: tests.length
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

  const { count: activeTests } = await supabase
    .from('tests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'IN_PROGRESS');

  const { data: scores } = await supabase
    .from('scores')
    .select('score, domain, users(id, name)');
  
  let averageScore = 0;
  const domainTotals: Record<string, { total: number; count: number }> = {};
  const studentTotals: Record<string, { name: string; total: number; count: number }> = {};

  if (scores && scores.length > 0) {
    let totalScore = 0;
    
    scores.forEach((s: any) => {
      totalScore += s.score;

      // Domain aggregation
      if (!domainTotals[s.domain]) {
        domainTotals[s.domain] = { total: 0, count: 0 };
      }
      domainTotals[s.domain].total += s.score;
      domainTotals[s.domain].count += 1;

      // Student aggregation
      if (s.users) {
        const studentId = s.users.id;
        if (!studentTotals[studentId]) {
          studentTotals[studentId] = { name: s.users.name || 'Unknown', total: 0, count: 0 };
        }
        studentTotals[studentId].total += s.score;
        studentTotals[studentId].count += 1;
      }
    });

    averageScore = Math.round(totalScore / scores.length);
  }

  const domainAverages = Object.entries(domainTotals).map(([domain, data]) => ({
    domain,
    average: Math.round((data.total / data.count) * 10) / 10 // keep 1 decimal
  }));

  const studentAverages = Object.entries(studentTotals).map(([id, data]) => ({
    id,
    name: data.name,
    average: Math.round((data.total / data.count) * 10) / 10
  })).sort((a, b) => a.average - b.average); // Ascending

  const studentsAtRisk = studentAverages.slice(0, 3);
  const topPerformers = studentAverages.slice(-3).reverse();

  return {
    totalStudents: totalStudents || 0,
    activeTests: activeTests || 0,
    averageScore,
    domainAverages,
    studentsAtRisk,
    topPerformers
  };
}
