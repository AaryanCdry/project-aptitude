'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCallerScope } from './scope';

// ─── Mentor dashboard summary ─────────────────────────────────────────────────
export async function getMentorDashboard() {
  const scope = await getCallerScope();
  if (!scope.userId) throw new Error('Not authenticated');

  // adminClient bypasses RLS (mentors are not is_admin()); a MENTOR sees only
  // students in their assigned classes (mentor_classes → class_id).
  const adminClient = createAdminClient();

  const emptyResult = {
    students: [], totalStudents: 0, activeStudents: 0,
    atRiskCount: 0, overallAvg: 0, recentTests: [],
  };

  let studentsQ = adminClient
    .from('users')
    .select('id, name, email, created_at, class_id')
    .eq('role', 'STUDENT');
  if (scope.role === 'MENTOR') {
    if (scope.classIds.length === 0) return emptyResult;
    studentsQ = studentsQ.in('class_id', scope.classIds);
  } else if (scope.collegeId) {
    // ADMIN / SUPER_ADMIN previewing the mentor view
    studentsQ = studentsQ.eq('college_id', scope.collegeId);
  }
  const { data: students } = await studentsQ;

  const studentIds = (students ?? []).map((s: any) => s.id);
  if (studentIds.length === 0) return emptyResult;

  // Scores and tests are independent — run in parallel
  const [{ data: scores }, { data: tests }] = await Promise.all([
    adminClient
      .from('scores')
      .select('student_id, score, domain, created_at')
      .in('student_id', studentIds)
      .neq('domain', 'OVERALL')
      .order('created_at', { ascending: false }),
    adminClient
      .from('tests')
      .select('student_id, id, status, type, created_at')
      .in('student_id', studentIds)
      .eq('status', 'COMPLETED'),
  ]);

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
  // Caller must be authenticated AND scoped to view this student.
  // Session client is RLS-bound to auth.uid() = student_id, which blocks
  // mentors from reading any student row — switch to adminClient after the
  // scope check.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { student: null, domainSummary: [], testHistory: [] };

  if (user.id !== studentId) {
    const { canViewStudent } = await import('./scope');
    const allowed = await canViewStudent(studentId);
    if (!allowed) return { student: null, domainSummary: [], testHistory: [] };
  }

  const adminClient = createAdminClient();

  // Student profile and scores are independent — run in parallel
  const [{ data: student }, { data: rawScores }] = await Promise.all([
    adminClient
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', studentId)
      .single(),
    adminClient
      .from('scores')
      .select('test_id, domain, score, percentile, created_at, tests!test_id(type, completed_at)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true }),
  ]);

  const allScores = rawScores ?? [];
  const domainOnly = allScores.filter((s: any) => s.domain !== 'OVERALL');

  // 1–5 mastery tier from running average (matches student dashboard banding).
  const levelFromAvg = (avg: number) =>
    avg >= 90 ? 5 : avg >= 75 ? 4 : avg >= 60 ? 3 : avg >= 40 ? 2 : 1;

  // Domain Performance cards: aggregate per-domain across all of this student's tests
  const domainAgg: Record<string, number[]> = {};
  domainOnly.forEach((s: any) => {
    if (!domainAgg[s.domain]) domainAgg[s.domain] = [];
    domainAgg[s.domain].push(s.score);
  });

  const domainSummary = Object.entries(domainAgg).map(([domain, vals]) => {
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    return { domain, avg, level: levelFromAvg(avg), count: vals.length };
  });

  // Test History: group score rows by test_id; each test gets one row with
  // its OVERALL score and the per-domain breakdown. Sorted newest-first.
  const byTest: Record<string, { test_id: string; date: string; overall: number | null; domains: Array<{ domain: string; score: number }> }> = {};
  for (const s of allScores) {
    const tid = (s as any).test_id;
    if (!tid) continue;
    if (!byTest[tid]) {
      const t = (s as any).tests as any;
      byTest[tid] = {
        test_id: tid,
        date: t?.completed_at ?? s.created_at,
        overall: null,
        domains: [],
      };
    }
    if (s.domain === 'OVERALL') {
      byTest[tid].overall = s.score;
    } else {
      byTest[tid].domains.push({ domain: s.domain, score: s.score });
    }
  }
  const testHistory = Object.values(byTest).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return { student, domainSummary, testHistory };
}

// ─── Proctoring flags ─────────────────────────────────────────────────────────
export async function getProctoringFlags() {
  const scope = await getCallerScope();
  if (!scope.userId) return [];

  const adminClient = createAdminClient();

  // Build the student set the caller can see (class-scope for MENTOR,
  // dept-scope for SUB_ADMIN, college-scope for ADMIN).
  let studentsQ = adminClient.from('users').select('id').eq('role', 'STUDENT');
  if (scope.collegeId) studentsQ = studentsQ.eq('college_id', scope.collegeId);
  if (scope.role === 'MENTOR') {
    if (scope.classIds.length === 0) return [];
    studentsQ = studentsQ.in('class_id', scope.classIds);
  } else if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    studentsQ = studentsQ.eq('department_id', scope.departmentId);
  }
  const { data: scopedStudents } = await studentsQ;
  const studentIds = (scopedStudents ?? []).map((s: any) => s.id);
  if (studentIds.length === 0) return [];

  const { data: scopedTests } = await adminClient
    .from('tests').select('id').in('student_id', studentIds);
  const testIds = (scopedTests ?? []).map((t: any) => t.id);
  if (testIds.length === 0) return [];

  const { data: logs } = await adminClient
    .from('proctoring_logs')
    .select(`
      id, tab_switches, face_detected, audio_flag, avg_time_ms, flagged, created_at,
      tests!test_id(id, student_id, type, completed_at,
        users!student_id(name, email)
      )
    `)
    .in('test_id', testIds)
    .order('created_at', { ascending: false })
    .limit(50);

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
// ─── Mentor's assigned classes (for /mentor/classes) ────────────────────────
export async function getMentorClasses() {
  const scope = await getCallerScope();
  if (!scope.userId || scope.role !== 'MENTOR' || scope.classIds.length === 0) return [];

  const adminClient = createAdminClient();

  // Pull classes + their department + the count of students in each class.
  const { data: classes } = await adminClient
    .from('classes')
    .select('id, name, year, section, dept_id, departments!dept_id(name, course_type)')
    .in('id', scope.classIds)
    .order('name');

  const classIds = (classes ?? []).map((c: any) => c.id);
  const { data: students } = classIds.length > 0
    ? await adminClient.from('users').select('id, class_id').eq('role', 'STUDENT').in('class_id', classIds)
    : { data: [] };

  const countByClass: Record<string, number> = {};
  (students ?? []).forEach((s: any) => {
    if (s.class_id) countByClass[s.class_id] = (countByClass[s.class_id] ?? 0) + 1;
  });

  return (classes ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    year: c.year,
    section: c.section,
    departmentName: (c.departments as any)?.name ?? null,
    courseType: (c.departments as any)?.course_type ?? null,
    studentCount: countByClass[c.id] ?? 0,
  }));
}

export async function getAssessments() {
  const scope = await getCallerScope();
  if (!scope.userId) return [];

  const adminClient = createAdminClient();

  let studentsQ = adminClient.from('users').select('id').eq('role', 'STUDENT');
  if (scope.collegeId) studentsQ = studentsQ.eq('college_id', scope.collegeId);
  if (scope.role === 'MENTOR') {
    if (scope.classIds.length === 0) return [];
    studentsQ = studentsQ.in('class_id', scope.classIds);
  } else if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    studentsQ = studentsQ.eq('department_id', scope.departmentId);
  }
  const { data: scopedStudents } = await studentsQ;
  const studentIds = (scopedStudents ?? []).map((s: any) => s.id);
  if (studentIds.length === 0) return [];

  const { data: tests } = await adminClient
    .from('tests')
    .select(`
      id, type, status, scheduled_at, created_at, completed_at,
      users!student_id(id, name, email),
      classes!class_id(id, name, departments(name))
    `)
    .in('student_id', studentIds)
    .order('scheduled_at', { ascending: false })
    .limit(40);

  return tests ?? [];
}
