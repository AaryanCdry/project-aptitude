'use server';

import { createClient } from '@/lib/supabase/server';

// ─── Mentor dashboard summary ─────────────────────────────────────────────────
export async function getMentorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: mentorProfile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = mentorProfile?.college_id;

  let studentsQ = supabase
    .from('users')
    .select('id, name, email, created_at')
    .eq('role', 'STUDENT');
  if (collegeId) studentsQ = (studentsQ as any).eq('college_id', collegeId);
  const { data: students } = await studentsQ;

  const studentIds = (students ?? []).map((s: any) => s.id);

  // Latest scores per student — exclude synthetic OVERALL rows
  const { data: scores } = await supabase
    .from('scores')
    .select('student_id, score, domain, created_at')
    .in('student_id', studentIds)
    .neq('domain', 'OVERALL')
    .order('created_at', { ascending: false });

  // Tests completed count per student
  const { data: tests } = await supabase
    .from('tests')
    .select('student_id, id, status, type, created_at')
    .in('student_id', studentIds)
    .eq('status', 'COMPLETED');

  // Aggregate per student
  const scoreMap: Record<string, number[]> = {};
  const domainMap: Record<string, Set<string>> = {};
  (scores ?? []).forEach((s: any) => {
    if (!scoreMap[s.student_id]) scoreMap[s.student_id] = [];
    scoreMap[s.student_id].push(s.score);
    if (!domainMap[s.student_id]) domainMap[s.student_id] = new Set();
    domainMap[s.student_id].add(s.domain);
  });

  const testCount: Record<string, number> = {};
  (tests ?? []).forEach((t: any) => {
    testCount[t.student_id] = (testCount[t.student_id] ?? 0) + 1;
  });

  const studentList = (students ?? []).map((s: any) => {
    const sScores = scoreMap[s.id] ?? [];
    const avg = sScores.length
      ? Math.round(sScores.reduce((a: number, b: number) => a + b, 0) / sScores.length)
      : null;
    const isAtRisk = avg !== null && avg < 50;
    return {
      ...s,
      avgScore: avg,
      testsCompleted: testCount[s.id] ?? 0,
      domainsActive: domainMap[s.id]?.size ?? 0,
      isAtRisk,
    };
  });

  const activeStudents = studentList.filter((s: any) => s.testsCompleted > 0).length;
  const atRiskCount = studentList.filter((s: any) => s.isAtRisk).length;
  const overallAvg = studentList
    .filter((s: any) => s.avgScore !== null)
    .reduce((acc: number, s: any, _: any, arr: any[]) => acc + s.avgScore / arr.length, 0);

  return {
    students: studentList,
    totalStudents: studentList.length,
    activeStudents,
    atRiskCount,
    overallAvg: Math.round(overallAvg) || 0,
    recentTests: (tests ?? []).slice(0, 10),
  };
}

// ─── Student detail for mentor ────────────────────────────────────────────────
export async function getStudentDetail(studentId: string) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from('users')
    .select('id, name, email, created_at')
    .eq('id', studentId)
    .single();

  const { data: scores } = await supabase
    .from('scores')
    .select('domain, score, percentile, created_at, tests!test_id(type, completed_at)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true });

  const { data: domainLevels } = await supabase
    .from('domain_progress')
    .select('domain, level, updated_at')
    .eq('student_id', studentId);

  // Domain averages
  const domainAgg: Record<string, number[]> = {};
  (scores ?? []).forEach((s: any) => {
    if (!domainAgg[s.domain]) domainAgg[s.domain] = [];
    domainAgg[s.domain].push(s.score);
  });

  const domainSummary = Object.entries(domainAgg).map(([domain, vals]) => ({
    domain,
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    level: (domainLevels ?? []).find((l: any) => l.domain === domain)?.level ?? 1,
    count: vals.length,
  }));

  return { student, scores: scores ?? [], domainSummary };
}

// ─── Proctoring flags ─────────────────────────────────────────────────────────
export async function getProctoringFlags() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: mentorProfile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = mentorProfile?.college_id;

  // Scope to this college's students
  let studentIdsQ = supabase.from('users').select('id').eq('role', 'STUDENT');
  if (collegeId) studentIdsQ = (studentIdsQ as any).eq('college_id', collegeId);
  const { data: collegeStudents } = await studentIdsQ;
  const collegeStudentIds = (collegeStudents ?? []).map((s: any) => s.id);

  // Get test IDs for those students
  let testIdsQ = supabase.from('tests').select('id');
  if (collegeStudentIds.length) testIdsQ = (testIdsQ as any).in('student_id', collegeStudentIds);
  const { data: collegTests } = await testIdsQ;
  const collegeTestIds = (collegTests ?? []).map((t: any) => t.id);

  let logsQ = supabase
    .from('proctoring_logs')
    .select(`
      id, tab_switches, face_detected, audio_flag, avg_time_ms, flagged, created_at,
      tests!test_id(id, student_id, type, completed_at,
        users!student_id(name, email)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);
  if (collegeTestIds.length) logsQ = (logsQ as any).in('test_id', collegeTestIds);
  const { data: logs } = await logsQ;

  return (logs ?? []).map((l: any) => ({
    id: l.id,
    tabSwitches: l.tab_switches,
    faceDetected: l.face_detected,
    audioFlag: l.audio_flag,
    avgTimeMs: l.avg_time_ms,
    flagged: l.flagged,
    testId: l.tests?.id,
    testType: l.tests?.type,
    student: l.tests?.users,
    date: l.created_at,
  }));
}

// ─── Assessments (scheduled tests) ────────────────────────────────────────────
export async function getAssessments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: mentorProfile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = mentorProfile?.college_id;

  let studentIdsQ = supabase.from('users').select('id').eq('role', 'STUDENT');
  if (collegeId) studentIdsQ = (studentIdsQ as any).eq('college_id', collegeId);
  const { data: collegeStudents } = await studentIdsQ;
  const collegeStudentIds = (collegeStudents ?? []).map((s: any) => s.id);

  let testsQ = supabase
    .from('tests')
    .select(`
      id, type, status, scheduled_at, created_at, completed_at,
      users!student_id(id, name, email),
      classes!class_id(id, name, departments(name))
    `)
    .order('scheduled_at', { ascending: false })
    .limit(40);
  if (collegeStudentIds.length) testsQ = (testsQ as any).in('student_id', collegeStudentIds);
  const { data: tests } = await testsQ;

  return tests ?? [];
}
