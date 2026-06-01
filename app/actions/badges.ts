'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCallerScope } from './scope';

export async function getStudentBadges(studentId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let targetId: string;
  if (!studentId || studentId === user.id) {
    targetId = user.id;
  } else {
    // Caller is requesting another student's badges — must be staff with scope
    const scope = await getCallerScope();
    if (!scope.role || !['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN', 'MENTOR'].includes(scope.role)) return [];
    targetId = studentId;
  }

  const { data } = await createAdminClient()
    .from('badges')
    .select('id, tier, issued_at, test_id, tests!test_id(cohort_assessments!assessment_id(title), users!student_id(classes!class_id(name)))')
    .eq('student_id', targetId)
    .order('issued_at', { ascending: false });

  return (data ?? []).map((b: any) => ({
    id: b.id as string,
    tier: b.tier as 'ADVANCED' | 'INTERMEDIATE' | 'BASIC',
    issuedAt: b.issued_at as string,
    testId: b.test_id as string,
    assessmentTitle: (b.tests as any)?.cohort_assessments?.title ?? null,
    className: (b.tests as any)?.users?.classes?.name ?? null,
  }));
}
