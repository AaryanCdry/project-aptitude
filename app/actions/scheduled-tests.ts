'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Student-facing: CENTER tests that aren't yet completed ─────────────────
// Returns the signed-in student's scheduled (or in-progress) college tests,
// each enriched with its parent assessment's title / domain / due_date so the
// dashboard card can render without a second round-trip.
export async function getStudentScheduledTests(studentId?: string) {
  let targetId = studentId;
  if (!targetId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    targetId = user.id;
  }

  const { data } = await createAdminClient()
    .from('tests')
    .select(`
      id, status, scheduled_at, completed_at, assessment_id,
      cohort_assessments!assessment_id(title, domain, instructions, due_date, scheduled_at)
    `)
    .eq('student_id', targetId)
    .eq('type', 'CENTER')
    .neq('status', 'COMPLETED')
    .order('scheduled_at', { ascending: true });

  return (data ?? []).map((t: any) => {
    const a = t.cohort_assessments as any;
    return {
      id: t.id,
      status: t.status as 'SCHEDULED' | 'IN_PROGRESS',
      // Prefer the assessment's open time over the per-row scheduled_at copy.
      opensAt: a?.scheduled_at ?? t.scheduled_at ?? null,
      dueAt: a?.due_date ?? null,
      assessmentId: t.assessment_id,
      title: a?.title ?? 'Scheduled Test',
      domain: a?.domain ?? null,
      instructions: a?.instructions ?? null,
    };
  });
}

// Verifies a CENTER test belongs to the caller, is inside its open window,
// and flips SCHEDULED → IN_PROGRESS so the runner can serve it.
export async function startScheduledTest(testId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();
  const { data: test } = await adminClient
    .from('tests')
    .select(`
      id, student_id, type, status, scheduled_at, assessment_id,
      cohort_assessments!assessment_id(scheduled_at, due_date)
    `)
    .eq('id', testId)
    .single();

  if (!test || test.student_id !== user.id || test.type !== 'CENTER') {
    return { error: 'Scheduled test not found.' };
  }
  if (test.status === 'COMPLETED') {
    return { error: 'This test is already completed.' };
  }

  const a = (test as any).cohort_assessments as any;
  const opensAt = a?.scheduled_at ?? test.scheduled_at ?? null;
  const dueAt = a?.due_date ?? null;
  const now = Date.now();
  if (opensAt && new Date(opensAt).getTime() > now) {
    return { error: 'This test has not opened yet.' };
  }
  if (dueAt && new Date(dueAt).getTime() < now) {
    return { error: 'This test has closed.' };
  }

  if (test.status !== 'IN_PROGRESS') {
    await adminClient.from('tests').update({ status: 'IN_PROGRESS' }).eq('id', testId);
  }
  return { success: true as const, testId };
}
