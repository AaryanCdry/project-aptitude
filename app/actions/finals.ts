'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';
import { createTestDraft } from './scheduling';

// ─── Student-facing: pending final exams ─────────────────────────────────────

export async function getStudentFinalExams(studentId?: string) {
  let targetId = studentId;
  if (!targetId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    targetId = user.id;
  }

  const { data } = await createAdminClient()
    .from('tests')
    .select('id, status, scheduled_at, completed_at')
    .eq('student_id', targetId)
    .eq('type', 'FINAL')
    .neq('status', 'COMPLETED')
    .order('scheduled_at', { ascending: true });

  return data ?? [];
}

// Verifies a FINAL test belongs to the caller and flips SCHEDULED → IN_PROGRESS
export async function startFinalExam(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();
  const { data: test } = await adminClient
    .from('tests')
    .select('id, student_id, type, status')
    .eq('id', testId)
    .single();

  if (!test || test.student_id !== user.id || test.type !== 'FINAL') {
    return { error: 'Final exam not found.' };
  }
  if (test.status === 'COMPLETED') {
    return { error: 'This final exam is already completed.' };
  }
  if (test.status !== 'IN_PROGRESS') {
    await adminClient.from('tests').update({ status: 'IN_PROGRESS' }).eq('id', testId);
  }
  return { success: true as const, testId };
}

// ─── Admin: create a final exam draft (two-step flow) ───────────────────────

export async function createFinalDraft(formData: FormData) {
  // Inject FINAL test type then delegate to the shared draft creator
  const enriched = new FormData();
  for (const [k, v] of formData.entries()) enriched.set(k, v);
  enriched.set('test_type', 'FINAL');
  return createTestDraft(enriched);
}

// ─── Admin: fetch scheduled finals ──────────────────────────────────────────

export async function getScheduledFinals() {
  const scope = await getCallerScope();
  if (!scope.userId || !scope.collegeId) return { finals: [], classes: [], assessments: [] };

  const adminClient = createAdminClient();

  // Classes in scope
  const { data: allClasses } = await adminClient
    .from('classes')
    .select('id, name, dept_id, departments!dept_id(college_id)')
    .order('name');
  const classes = (allClasses ?? []).filter((c: any) => {
    if (c.departments?.college_id !== scope.collegeId) return false;
    if (scope.role === 'SUB_ADMIN' && c.dept_id !== scope.departmentId) return false;
    return true;
  }).map((c: any) => ({ id: c.id, name: c.name }));

  // Final tests in scope
  const { data: finals } = await adminClient
    .from('tests')
    .select('id, scheduled_at, status, completed_at, student_id, users!student_id(name, email, college_id, department_id, class_id, classes!class_id(name))')
    .eq('type', 'FINAL')
    .order('scheduled_at', { ascending: false });

  const filtered = (finals ?? []).filter((t: any) => {
    const u = t.users as any;
    if (!u) return false;
    if (u.college_id !== scope.collegeId) return false;
    if (scope.role === 'SUB_ADMIN' && u.department_id !== scope.departmentId) return false;
    return true;
  });

  if (filtered.length === 0) return { finals: [], classes, assessments: [] };

  const testIds = filtered.map((t: any) => t.id as string);
  const completedTests = filtered.filter((t: any) => t.status === 'COMPLETED');
  const completedTestIds = completedTests.map((t: any) => t.id as string);
  const completedStudentIds = completedTests.map((t: any) => t.student_id as string);

  // Build the assessments query before Promise.all so it runs in parallel
  let assessmentsQuery = adminClient
    .from('cohort_assessments')
    .select('id, title, scheduled_at, due_date, class_ids, domain_quotas, created_at')
    .eq('status', 'ACTIVE')
    .eq('test_type', 'FINAL')
    .order('created_at', { ascending: false });
  if (scope.role !== 'SUPER_ADMIN') {
    assessmentsQuery = (assessmentsQuery as any).eq('college_id', scope.collegeId);
  }

  // All 4 batch-fetches are independent — run in parallel
  const [scoreResult, certResult, badgeResult, assessmentsResult] = await Promise.all([
    completedTestIds.length > 0
      ? adminClient.from('scores').select('test_id, score').in('test_id', completedTestIds).eq('domain', 'OVERALL')
      : Promise.resolve({ data: [] as any[] }),
    completedStudentIds.length > 0
      ? adminClient.from('certificates').select('student_id, tier, qr_code').in('student_id', completedStudentIds).eq('revoked', false)
      : Promise.resolve({ data: [] as any[] }),
    completedTestIds.length > 0
      ? adminClient.from('badges').select('test_id, tier').in('test_id', completedTestIds)
      : Promise.resolve({ data: [] as any[] }),
    assessmentsQuery,
  ]);

  // qr_code format: "CERT-{uuid_36}-{base36}" → testId = qr_code.substring(5, 41)
  const scoreMap: Record<string, number> = {};
  for (const s of scoreResult.data ?? []) scoreMap[(s as any).test_id] = (s as any).score;

  const certMap: Record<string, string> = {};
  for (const c of certResult.data ?? []) {
    const testId = (c as any).qr_code?.substring(5, 41)?.toLowerCase();
    if (testId) certMap[testId] = (c as any).tier;
  }

  const badgeMap: Record<string, string> = {};
  for (const b of badgeResult.data ?? []) badgeMap[(b as any).test_id] = (b as any).tier;

  const rawAssessments = assessmentsResult.data;

  const classNameMap = Object.fromEntries(classes.map((c: any) => [c.id, c.name]));

  // Count tests per assessment
  const assessmentTestCounts: Record<string, { total: number; completed: number }> = {};
  for (const t of filtered) {
    const aid = (t as any).assessment_id as string | null;
    if (!aid) continue;
    if (!assessmentTestCounts[aid]) assessmentTestCounts[aid] = { total: 0, completed: 0 };
    assessmentTestCounts[aid].total++;
    if ((t as any).status === 'COMPLETED') assessmentTestCounts[aid].completed++;
  }

  const assessments = (rawAssessments ?? []).map((a: any) => {
    const ids: string[] = a.class_ids ?? [];
    const counts = assessmentTestCounts[a.id] ?? { total: 0, completed: 0 };
    return {
      id: a.id as string,
      title: a.title as string,
      scheduled_at: (a.scheduled_at ?? null) as string | null,
      due_date: (a.due_date ?? null) as string | null,
      class_ids: ids,
      class_names: ids.map((id: string) => classNameMap[id] ?? id).filter(Boolean),
      domain_quotas: (a.domain_quotas ?? {}) as Record<string, number>,
      totalStudents: counts.total,
      completedStudents: counts.completed,
    };
  });

  return {
    finals: filtered.map((t: any) => ({
      id: t.id as string,
      scheduled_at: t.scheduled_at as string | null,
      status: t.status as string,
      completed_at: t.completed_at as string | null,
      studentName: (t.users as any)?.name ?? (t.users as any)?.email ?? 'Unknown',
      className: ((t.users as any)?.classes as any)?.name ?? null,
      score: scoreMap[t.id] ?? null,
      certTier: certMap[t.id] ?? null,
      badgeTier: badgeMap[t.id] ?? null,
    })),
    classes,
    assessments,
  };
}

// ─── Admin: cancel a scheduled final ────────────────────────────────────────

export async function cancelFinal(testId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!['ADMIN', 'SUB_ADMIN'].includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();
  const { data: test } = await adminClient
    .from('tests')
    .select('id, status, student_id, users!student_id(college_id, department_id)')
    .eq('id', testId)
    .eq('type', 'FINAL')
    .single();

  if (!test) return { error: 'Final exam not found.' };

  const u = (test as any).users as any;
  if (u?.college_id !== scope.collegeId) return { error: 'Outside your college scope.' };
  if (scope.role === 'SUB_ADMIN' && u?.department_id !== scope.departmentId) {
    return { error: 'Outside your department scope.' };
  }
  if ((test as any).status !== 'SCHEDULED') {
    return { error: 'Only SCHEDULED finals can be cancelled.' };
  }

  const { error } = await adminClient.from('tests').delete().eq('id', testId);
  if (error) return { error: error.message };

  revalidatePath('/admin/finals');
  return { success: true as const };
}

// ─── Admin: reschedule a pending final ──────────────────────────────────────

export async function rescheduleFinal(testId: string, newScheduledAt: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!['ADMIN', 'SUB_ADMIN'].includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();
  const { data: test } = await adminClient
    .from('tests')
    .select('id, status, student_id, users!student_id(college_id, department_id)')
    .eq('id', testId)
    .eq('type', 'FINAL')
    .single();

  if (!test) return { error: 'Final exam not found.' };

  const u = (test as any).users as any;
  if (u?.college_id !== scope.collegeId) return { error: 'Outside your college scope.' };
  if (scope.role === 'SUB_ADMIN' && u?.department_id !== scope.departmentId) {
    return { error: 'Outside your department scope.' };
  }
  if ((test as any).status !== 'SCHEDULED') {
    return { error: 'Only SCHEDULED finals can be rescheduled.' };
  }

  const { error } = await adminClient
    .from('tests')
    .update({ scheduled_at: new Date(newScheduledAt).toISOString() })
    .eq('id', testId);
  if (error) return { error: error.message };

  revalidatePath('/admin/finals');
  return { success: true as const };
}

// ─── Admin: edit a finalized final assessment (title + dates) ────────────────

export async function updateFinalAssessment(
  assessmentId: string,
  data: { title: string; scheduled_at: string | null; due_date: string | null },
) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(scope.role ?? '')) return { error: 'Not authorized.' };

  if (!data.title.trim()) return { error: 'Title is required.' };

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('cohort_assessments')
    .select('id, college_id, status, test_type, created_by')
    .eq('id', assessmentId)
    .single();

  if (!row) return { error: 'Assessment not found.' };
  if ((row as any).status !== 'ACTIVE') return { error: 'Assessment is not active.' };
  if ((row as any).test_type !== 'FINAL') return { error: 'Not a final assessment.' };
  if (scope.role !== 'SUPER_ADMIN' && (row as any).college_id !== scope.collegeId) {
    return { error: 'Outside your college scope.' };
  }

  const scheduledAt = data.scheduled_at ? new Date(data.scheduled_at).toISOString() : null;
  const dueDate = data.due_date ? new Date(data.due_date).toISOString() : null;

  const { error: assessErr } = await adminClient
    .from('cohort_assessments')
    .update({ title: data.title.trim(), scheduled_at: scheduledAt, due_date: dueDate })
    .eq('id', assessmentId);
  if (assessErr) return { error: assessErr.message };

  // Propagate new scheduled_at to all SCHEDULED tests for this assessment
  if (scheduledAt) {
    await adminClient
      .from('tests')
      .update({ scheduled_at: scheduledAt })
      .eq('assessment_id', assessmentId)
      .eq('status', 'SCHEDULED');
  }

  revalidatePath('/admin/finals');
  return { success: true as const };
}

// ─── Admin: assign an existing final to an additional class ──────────────────

export async function assignFinalToClass(assessmentId: string, classId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();
  const { data: row } = await adminClient
    .from('cohort_assessments')
    .select('id, college_id, status, test_type, class_ids, scheduled_at')
    .eq('id', assessmentId)
    .single();

  if (!row) return { error: 'Assessment not found.' };
  if ((row as any).status !== 'ACTIVE') return { error: 'Assessment is not active.' };
  if ((row as any).test_type !== 'FINAL') return { error: 'Not a final assessment.' };
  if (scope.role !== 'SUPER_ADMIN' && (row as any).college_id !== scope.collegeId) {
    return { error: 'Outside your college scope.' };
  }

  const currentClassIds: string[] = (row as any).class_ids ?? [];
  if (currentClassIds.includes(classId)) return { error: 'This class already has this final assigned.' };

  // Verify class scope
  const { data: classRow } = await adminClient
    .from('classes')
    .select('id, dept_id, departments!dept_id(college_id)')
    .eq('id', classId)
    .single();
  if (!classRow) return { error: 'Class not found.' };
  if ((classRow as any).departments?.college_id !== scope.collegeId) {
    return { error: 'Class outside your college.' };
  }
  if (scope.role === 'SUB_ADMIN' && (classRow as any).dept_id !== scope.departmentId) {
    return { error: 'Class outside your department.' };
  }

  // Get students in the class
  const { data: students } = await adminClient
    .from('users')
    .select('id')
    .eq('class_id', classId)
    .eq('role', 'STUDENT');
  const studentIds = (students ?? []).map((s: any) => s.id as string);
  if (studentIds.length === 0) return { error: 'No students in this class.' };

  // Exclude students who already have a test for this assessment
  const { data: existingTests } = await adminClient
    .from('tests')
    .select('student_id')
    .eq('assessment_id', assessmentId)
    .in('student_id', studentIds);
  const existingSet = new Set((existingTests ?? []).map((t: any) => t.student_id as string));
  const newStudentIds = studentIds.filter((id) => !existingSet.has(id));
  if (newStudentIds.length === 0) return { error: 'All students in this class already have this final.' };

  const scheduledAt = (row as any).scheduled_at ?? new Date().toISOString();
  const testRows = newStudentIds.map((id) => ({
    student_id: id,
    type: 'FINAL' as const,
    status: 'SCHEDULED' as const,
    scheduled_at: scheduledAt,
    assessment_id: assessmentId,
  }));

  const { error: testsErr } = await adminClient.from('tests').insert(testRows);
  if (testsErr) return { error: testsErr.message };

  await adminClient
    .from('cohort_assessments')
    .update({ class_ids: [...currentClassIds, classId] })
    .eq('id', assessmentId);

  revalidatePath('/admin/finals');
  return { success: true as const, scheduled: newStudentIds.length };
}
