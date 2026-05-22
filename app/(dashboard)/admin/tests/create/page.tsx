import { getCallerScope, resolveAllowedClassIds } from '@/app/actions/scope';
import { createAdminClient } from '@/lib/supabase/admin';
import CreateTestClient from './CreateTestClient';

export default async function CreateTestPage() {
  const scope = await getCallerScope();
  const allowedClassIds = await resolveAllowedClassIds(scope);

  const adminClient = createAdminClient();

  // Cohorts in scope
  let cohortsQ = adminClient
    .from('cohorts')
    .select('id, name, class_id, dept_id')
    .order('name');
  if (scope.collegeId) cohortsQ = cohortsQ.eq('college_id', scope.collegeId);
  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    cohortsQ = cohortsQ.eq('dept_id', scope.departmentId);
  }
  const { data: cohorts } = await cohortsQ;

  // Classes in scope
  let classesQ = adminClient
    .from('classes')
    .select('id, name, year, section, dept_id, departments!dept_id(name)')
    .order('name');
  if (allowedClassIds !== null) {
    if (allowedClassIds.length === 0) {
      return (
        <div className="p-12 text-center">
          <h1 className="font-headline-md text-xl text-on-surface mb-2">No classes available</h1>
          <p className="font-body-md text-on-surface-variant">You don&apos;t have any classes in scope to create a test for.</p>
        </div>
      );
    }
    classesQ = classesQ.in('id', allowedClassIds);
  }
  const { data: classes } = await classesQ;

  return (
    <CreateTestClient
      role={scope.role}
      cohorts={(cohorts ?? []) as any}
      classes={(classes ?? []) as any}
    />
  );
}
