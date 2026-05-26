'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Returns the assessments assigned to a student via their class membership.
// Optional studentId: defaults to the signed-in student. Caller is responsible
// for scope checks (canViewStudent) when supplying a different student.
export async function getStudentAssignedAssessments(studentId?: string) {
  let targetId = studentId;
  if (!targetId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    targetId = user.id;
  }

  const adminClient = createAdminClient();

  // Get the student's class name for display
  const { data: studentRow } = await adminClient
    .from('users')
    .select('class_id, classes!class_id(name)')
    .eq('id', targetId)
    .single();
  const className: string = (studentRow?.classes as any)?.name ?? '';

  // Query tests for this student, joining assessment metadata
  const { data: tests, error } = await adminClient
    .from('tests')
    .select('id, status, assessment_id, cohort_assessments!assessment_id(id, title, domain, instructions, due_date, scheduled_at, status)')
    .eq('student_id', targetId)
    .order('created_at', { ascending: false });

  if (error) return [];

  const now = new Date();
  return (tests ?? [])
    .filter((t: any) => {
      const a = t.cohort_assessments as any;
      return a && a.status === 'ACTIVE';
    })
    .map((t: any) => {
      const a = t.cohort_assessments as any;
      const due = a.due_date ? new Date(a.due_date) : null;
      const opensAt = a.scheduled_at ? new Date(a.scheduled_at) : null;
      const isOverdue = due ? due < now : false;
      const isOpenable = !opensAt || opensAt <= now;
      return {
        id: a.id,
        title: a.title,
        domain: a.domain ?? null,
        instructions: a.instructions ?? null,
        due_date: a.due_date ?? null,
        scheduled_at: a.scheduled_at ?? null,
        className,
        isOverdue,
        isOpenable,
        testId: t.id,
        testStatus: t.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | null,
      };
    });
}
