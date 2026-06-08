'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getGrade } from '@/lib/adaptive';

export async function getAdminReportData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = profile?.college_id;

  let studentsQ = supabase
    .from('users')
    .select('id, name, email, created_at')
    .eq('role', 'STUDENT')
    .order('name', { ascending: true });
  if (collegeId) studentsQ = (studentsQ as any).eq('college_id', collegeId);
  const { data: students } = await studentsQ;

  const studentIds = (students ?? []).map((s: any) => s.id);
  if (studentIds.length === 0) return { rows: [], totalStudents: 0, totalTests: 0, overallAvg: 0 };

  const { data: tests } = await supabase
    .from('tests')
    .select('id, student_id, type, completed_at')
    .in('student_id', studentIds)
    .eq('status', 'COMPLETED');

  const { data: scores } = await supabase
    .from('scores')
    .select('student_id, domain, score')
    .in('student_id', studentIds)
    .neq('domain', 'OVERALL');

  const scoreMap: Record<string, number[]> = {};
  (scores ?? []).forEach((s: any) => {
    if (!scoreMap[s.student_id]) scoreMap[s.student_id] = [];
    scoreMap[s.student_id].push(s.score);
  });

  const testCount: Record<string, number> = {};
  (tests ?? []).forEach((t: any) => {
    testCount[t.student_id] = (testCount[t.student_id] ?? 0) + 1;
  });

  const rows = (students ?? []).map((s: any) => {
    const sScores = scoreMap[s.id] ?? [];
    const avg = sScores.length
      ? Math.round(sScores.reduce((a: number, b: number) => a + b, 0) / sScores.length)
      : 0;
    return {
      id: s.id,
      name: s.name ?? 'N/A',
      email: s.email ?? '',
      joined: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      testsCompleted: testCount[s.id] ?? 0,
      avgScore: avg,
      grade: getGrade(avg),
    };
  });

  const scored = rows.filter(r => r.avgScore > 0);
  const overallAvg = scored.length
    ? Math.round(scored.reduce((a, r) => a + r.avgScore, 0) / scored.length)
    : 0;

  return {
    rows,
    totalStudents: rows.length,
    totalTests: (tests ?? []).length,
    overallAvg,
  };
}

export async function getAdminSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single();

  return userData;
}

export async function updateAdminSettings(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ name })
    .eq('id', user.id);

  if (error) throw error;
  return { success: true };
}

export async function getStudentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('users')
    .select('id, name, email, role, created_at, classes!class_id(name, year, section, batches!batch_id(name), academic_years!academic_year_id(name), departments!dept_id(name, course_type))')
    .eq('id', user.id)
    .single();

  return data;
}

export async function updateStudentProfile(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ name })
    .eq('id', user.id);

  if (error) throw error;
  return { success: true };
}

export async function getSuperAdminData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const adminClient = createAdminClient();

  const [{ data: colleges }, { count: totalStudents }, { count: totalTests }] = await Promise.all([
    adminClient.from('colleges').select('id, name, code, status, created_at').order('created_at', { ascending: false }),
    adminClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
    adminClient.from('tests').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
  ]);

  return {
    colleges: colleges ?? [],
    totalColleges: (colleges ?? []).length,
    totalStudents: totalStudents ?? 0,
    totalTests: totalTests ?? 0,
  };
}

export async function getSubAdminData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = profile?.college_id;

  let studentsQ = supabase
    .from('users')
    .select('id, name, email, created_at')
    .eq('role', 'STUDENT');
  if (collegeId) studentsQ = (studentsQ as any).eq('college_id', collegeId);
  const { data: students } = await studentsQ;

  const studentIds = (students ?? []).map((s: any) => s.id);

  const { data: scores } = await supabase
    .from('scores')
    .select('student_id, domain, score')
    .in('student_id', studentIds.length ? studentIds : ['none'])
    .neq('domain', 'OVERALL');

  const scoreMap: Record<string, number[]> = {};
  (scores ?? []).forEach((s: any) => {
    if (!scoreMap[s.student_id]) scoreMap[s.student_id] = [];
    scoreMap[s.student_id].push(s.score);
  });

  const rows = (students ?? []).map((s: any) => {
    const sScores = scoreMap[s.id] ?? [];
    const avg = sScores.length
      ? Math.round(sScores.reduce((a: number, b: number) => a + b, 0) / sScores.length)
      : 0;
    return { id: s.id, name: s.name, email: s.email, avgScore: avg };
  });

  return { students: rows };
}

export interface ExamRow {
  id: string;
  type: 'SELF' | 'CENTER' | 'FINAL';
  studentName: string;
  studentEmail: string;
  className: string | null;
  assessmentTitle: string | null;
  completedAt: string;
  domainScores: {
    QUANTITATIVE: number | null;
    LOGICAL: number | null;
    VERBAL: number | null;
    SPATIAL: number | null;
  };
  overallScore: number | null;
  avgPercentile: number | null;
  certTier: string | null;
  badgeTier: string | null;
}

export async function getExamAnalytics(): Promise<ExamRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('college_id, role, department_id')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'];
  if (!profile || !allowedRoles.includes(profile.role)) throw new Error('Forbidden');

  const collegeId = profile.college_id;
  const isSubAdmin = profile.role === 'SUB_ADMIN';

  // Fail closed — ADMIN/SUB_ADMIN must be scoped to a college
  if (profile.role !== 'SUPER_ADMIN' && !collegeId) return [];

  const adminClient = createAdminClient();

  let studentsQ = adminClient
    .from('users')
    .select('id')
    .eq('role', 'STUDENT');
  if (collegeId) studentsQ = (studentsQ as any).eq('college_id', collegeId);
  if (isSubAdmin && profile.department_id) studentsQ = (studentsQ as any).eq('department_id', profile.department_id);
  const { data: students } = await studentsQ;

  const studentIds = (students ?? []).map((s: any) => s.id as string);
  if (studentIds.length === 0) return [];

  const { data: tests } = await adminClient
    .from('tests')
    .select('id, type, completed_at, student_id, assessment_id, users!student_id(name, email, classes!class_id(name)), cohort_assessments!assessment_id(title)')
    .in('student_id', studentIds)
    .eq('status', 'COMPLETED')
    .order('completed_at', { ascending: false })
    .limit(500);

  const rows = tests ?? [];
  if (rows.length === 0) return [];

  const testIds = rows.map((t: any) => t.id as string);
  const completedFinalIds = rows.filter((t: any) => t.type === 'FINAL').map((t: any) => t.id as string);
  const completedFinalStudentIds = rows.filter((t: any) => t.type === 'FINAL').map((t: any) => t.student_id as string);

  // Batch-fetch domain scores
  const { data: scoreRows } = await adminClient
    .from('scores')
    .select('test_id, domain, score, percentile')
    .in('test_id', testIds);

  const scoreMap: Record<string, Record<string, { score: number; percentile: number | null }>> = {};
  for (const s of scoreRows ?? []) {
    const tid = (s as any).test_id as string;
    if (!scoreMap[tid]) scoreMap[tid] = {};
    scoreMap[tid][(s as any).domain] = { score: (s as any).score, percentile: (s as any).percentile ?? null };
  }

  // Batch-fetch cert tiers for FINAL tests (qr_code: "CERT-{uuid36}-{base36}")
  const certMap: Record<string, string> = {};
  if (completedFinalStudentIds.length > 0) {
    const { data: certRows } = await adminClient
      .from('certificates')
      .select('student_id, tier, qr_code')
      .in('student_id', completedFinalStudentIds)
      .eq('revoked', false);
    for (const c of certRows ?? []) {
      const testId = (c as any).qr_code?.substring(5, 41)?.toLowerCase();
      if (testId) certMap[testId] = (c as any).tier;
    }
  }

  // Batch-fetch badge tiers for FINAL tests
  const badgeMap: Record<string, string> = {};
  if (completedFinalIds.length > 0) {
    const { data: badgeRows } = await adminClient
      .from('badges')
      .select('test_id, tier')
      .in('test_id', completedFinalIds);
    for (const b of badgeRows ?? []) badgeMap[(b as any).test_id] = (b as any).tier;
  }

  return rows.map((t: any): ExamRow => {
    const user = t.users as any;
    const domainData = scoreMap[t.id] ?? {};
    const domainPercentiles = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'SPATIAL']
      .map(d => domainData[d]?.percentile)
      .filter((p): p is number => p != null);
    const avgPercentile = domainPercentiles.length
      ? Math.round(domainPercentiles.reduce((a, b) => a + b, 0) / domainPercentiles.length)
      : null;

    return {
      id: t.id,
      type: t.type as 'SELF' | 'CENTER' | 'FINAL',
      studentName: user?.name ?? user?.email ?? 'Unknown',
      studentEmail: user?.email ?? '',
      className: user?.classes?.name ?? null,
      assessmentTitle: (t.cohort_assessments as any)?.title ?? null,
      completedAt: t.completed_at,
      domainScores: {
        QUANTITATIVE: domainData.QUANTITATIVE?.score ?? null,
        LOGICAL: domainData.LOGICAL?.score ?? null,
        VERBAL: domainData.VERBAL?.score ?? null,
        SPATIAL: domainData.SPATIAL?.score ?? null,
      },
      overallScore: domainData.OVERALL?.score ?? null,
      avgPercentile,
      certTier: certMap[t.id] ?? null,
      badgeTier: badgeMap[t.id] ?? null,
    };
  });
}

export interface ExportData {
  generatedAt: string;
  summary: { totalStudents: number; totalTests: number; overallAvg: number };
  domainAverages: { domain: string; average: number }[];
  rows: { name: string; email: string; testsCompleted: number; avgScore: number; grade: string; joined: string }[];
}

export async function getExportData(): Promise<ExportData> {
  const { rows, totalStudents, totalTests, overallAvg } = await getAdminReportData();

  const adminClient = createAdminClient();
  const studentIds = (rows as any[]).map(r => r.id);

  let domainAverages: { domain: string; average: number }[] = [];
  if (studentIds.length) {
    const { data: scores } = await adminClient
      .from('scores')
      .select('domain, score')
      .in('student_id', studentIds)
      .neq('domain', 'OVERALL');

    const totals: Record<string, { total: number; count: number }> = {};
    (scores ?? []).forEach((s: any) => {
      if (!totals[s.domain]) totals[s.domain] = { total: 0, count: 0 };
      totals[s.domain].total += s.score;
      totals[s.domain].count += 1;
    });
    domainAverages = Object.entries(totals).map(([domain, d]) => ({
      domain: domain.charAt(0) + domain.slice(1).toLowerCase(),
      average: Math.round((d.total / d.count) * 10) / 10,
    })).sort((a, b) => b.average - a.average);
  }

  return {
    generatedAt: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
    summary: { totalStudents, totalTests, overallAvg },
    domainAverages,
    rows: (rows as any[]).map(r => ({
      name: r.name,
      email: r.email,
      testsCompleted: r.testsCompleted,
      avgScore: r.avgScore,
      grade: r.grade,
      joined: r.joined,
    })),
  };
}
