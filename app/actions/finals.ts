'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

// ─── Student-facing: pending final exams ─────────────────────────────────────

// Returns the signed-in student's final exams that are not yet completed.
export async function getStudentFinalExams() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await createAdminClient()
    .from('tests')
    .select('id, status, scheduled_at, completed_at')
    .eq('student_id', user.id)
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

// Schedule a FINAL exam: create one tests row per cohort member with type='FINAL'.
// Students will see these via getOrCreateActiveTest on their next visit.
export async function scheduleFinalForCohort(formData: FormData) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!['ADMIN', 'SUB_ADMIN'].includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const cohortId = formData.get('cohort_id') as string;
  const scheduledAtRaw = (formData.get('scheduled_at') as string) || '';

  if (!cohortId) return { error: 'Cohort is required.' };

  const adminClient = createAdminClient();

  // Verify cohort scope
  const { data: cohort } = await adminClient
    .from('cohorts')
    .select('id, college_id, dept_id, name')
    .eq('id', cohortId)
    .single();
  if (!cohort) return { error: 'Cohort not found.' };
  if (cohort.college_id !== scope.collegeId) return { error: 'Cohort outside your college.' };
  if (scope.role === 'SUB_ADMIN' && cohort.dept_id !== scope.departmentId) {
    return { error: 'Cohort outside your department.' };
  }

  const { data: members } = await adminClient
    .from('cohort_members')
    .select('student_id')
    .eq('cohort_id', cohortId);

  const studentIds = (members ?? []).map((m: any) => m.student_id);
  if (studentIds.length === 0) return { error: 'No students in this cohort.' };

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
  if (!scope.userId || !scope.collegeId) return { finals: [], cohorts: [] };

  const adminClient = createAdminClient();

  // Cohorts in scope
  let cohortsQ = adminClient
    .from('cohorts')
    .select('id, name, dept_id')
    .eq('college_id', scope.collegeId)
    .order('name');
  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    cohortsQ = cohortsQ.eq('dept_id', scope.departmentId);
  }
  const { data: cohorts } = await cohortsQ;

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
    cohorts: cohorts ?? [],
  };
}
