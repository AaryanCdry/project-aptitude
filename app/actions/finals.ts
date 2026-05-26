'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

// ─── Student-facing: pending final exams ─────────────────────────────────────

// Optional studentId: defaults to the signed-in student. Caller is responsible
// for scope checks (canViewStudent) when supplying a different student.
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
// so the assessment runner can serve it. Returns the test id or an error.
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

// Schedule a FINAL exam: create one tests row per student in the selected class.
export async function scheduleFinalForCohort(formData: FormData) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!['ADMIN', 'SUB_ADMIN'].includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const classId = formData.get('class_id') as string;
  const scheduledAtRaw = (formData.get('scheduled_at') as string) || '';

  if (!classId) return { error: 'Class is required.' };

  const adminClient = createAdminClient();

  // Verify class scope
  const { data: classRow } = await adminClient
    .from('classes')
    .select('id, dept_id, departments!dept_id(college_id)')
    .eq('id', classId)
    .single();
  if (!classRow) return { error: 'Class not found.' };
  const classCollegeId = (classRow as any).departments?.college_id;
  if (classCollegeId !== scope.collegeId) return { error: 'Class outside your college.' };
  if (scope.role === 'SUB_ADMIN' && (classRow as any).dept_id !== scope.departmentId) {
    return { error: 'Class outside your department.' };
  }

  const { data: students } = await adminClient
    .from('users')
    .select('id')
    .eq('class_id', classId)
    .eq('role', 'STUDENT');

  const studentIds = (students ?? []).map((s: any) => s.id);
  if (studentIds.length === 0) return { error: 'No students in this class.' };

  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw).toISOString() : new Date().toISOString();
  const rows = studentIds.map(id => ({
    student_id: id,
    type: 'FINAL' as const,
    status: 'SCHEDULED' as const,
    scheduled_at: scheduledAt,
  }));

  const { error } = await adminClient.from('tests').insert(rows);
  if (error) return { error: error.message };

  revalidatePath('/admin/finals');
  return { success: true as const, count: rows.length };
}

export async function getScheduledFinals() {
  const scope = await getCallerScope();
  if (!scope.userId || !scope.collegeId) return { finals: [], classes: [] };

  const adminClient = createAdminClient();

  // Classes in scope
  let classesQ = adminClient
    .from('classes')
    .select('id, name, dept_id, departments!dept_id(college_id)')
    .order('name');
  const { data: allClasses } = await classesQ;
  const classes = (allClasses ?? []).filter((c: any) => {
    if (c.departments?.college_id !== scope.collegeId) return false;
    if (scope.role === 'SUB_ADMIN' && c.dept_id !== scope.departmentId) return false;
    return true;
  }).map((c: any) => ({ id: c.id, name: c.name }));

  // Final tests in scope (aggregated by student)
  const { data: finals } = await adminClient
    .from('tests')
    .select('id, scheduled_at, status, completed_at, student_id, users!student_id(name, email, college_id, department_id)')
    .eq('type', 'FINAL')
    .order('scheduled_at', { ascending: false });

  const filtered = (finals ?? []).filter((t: any) => {
    const u = t.users as any;
    if (!u) return false;
    if (u.college_id !== scope.collegeId) return false;
    if (scope.role === 'SUB_ADMIN' && u.department_id !== scope.departmentId) return false;
    return true;
  });

  return {
    finals: filtered.map((t: any) => ({
      id: t.id,
      scheduled_at: t.scheduled_at,
      status: t.status,
      completed_at: t.completed_at,
      studentName: (t.users as any)?.name ?? (t.users as any)?.email ?? 'Unknown',
    })),
    classes,
  };
}
