import { redirect } from 'next/navigation';
import { getCallerScope, resolveAllowedClassIds } from '../actions/scope';
import { createAdminClient } from '@/lib/supabase/admin';
import ScheduleFormClient from './ScheduleFormClient';

const STAFF_ROLES = ['ADMIN', 'SUB_ADMIN', 'MENTOR', 'SUPER_ADMIN'];

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-12 text-center">
      <span className="material-symbols-outlined text-5xl text-outline block mb-2">event_busy</span>
      <h1 className="font-headline-md text-xl text-on-surface mb-2">Nothing to schedule</h1>
      <p className="font-body-md text-on-surface-variant">{text}</p>
    </div>
  );
}

export default async function ScheduleTestPage() {
  const scope = await getCallerScope();
  if (!scope.userId) redirect('/');
  if (!STAFF_ROLES.includes(scope.role ?? '')) redirect('/');

  const allowedClassIds = await resolveAllowedClassIds(scope);
  const adminClient = createAdminClient();

  let cohortsQ = adminClient
    .from('cohorts')
    .select('id, name, class_id, dept_id')
    .order('name');
  if (scope.collegeId) cohortsQ = cohortsQ.eq('college_id', scope.collegeId);
  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    cohortsQ = cohortsQ.eq('dept_id', scope.departmentId);
  }
  if (scope.role === 'MENTOR') {
    if (scope.classIds.length === 0) {
      return <EmptyState text="You have no classes assigned. Ask your HOD to assign you to a class." />;
    }
    cohortsQ = cohortsQ.in('class_id', scope.classIds);
  }
  const { data: cohorts } = await cohortsQ;

  let classesQ = adminClient
    .from('classes')
    .select('id, name, year, section, dept_id, departments!dept_id(name)')
    .order('name');
  if (allowedClassIds !== null) {
    if (allowedClassIds.length === 0) {
      return <EmptyState text="You have no classes in scope to schedule a test for." />;
    }
    classesQ = classesQ.in('id', allowedClassIds);
  }
  const { data: classes } = await classesQ;

  return (
    <ScheduleFormClient
      role={scope.role}
      cohorts={(cohorts ?? []) as any}
      classes={(classes ?? []) as any}
    />
  );
}
