import { createClient } from '@/lib/supabase/server';
import { getDepartments, getClasses } from '@/app/actions/departments';
import ManualEnrollmentForm from './ManualEnrollmentForm';

export default async function NewEnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>;
}) {
  const { cohort: preselectedCohortId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Cohorts scoped to admin's college
  let cohortsQ = supabase.from('cohorts').select('id, name').order('created_at', { ascending: false });
  if (user) {
    const { data: profile } = await supabase.from('users').select('college_id').eq('id', user.id).single();
    if (profile?.college_id) cohortsQ = (cohortsQ as any).eq('college_id', profile.college_id);
  }
  const { data: cohorts } = await cohortsQ;

  const [departments, classes] = await Promise.all([
    getDepartments(),
    getClasses(),
  ]);

  return (
    <ManualEnrollmentForm
      cohorts={cohorts ?? []}
      preselectedCohortId={preselectedCohortId ?? null}
      departments={departments.map(d => ({ id: d.id, name: d.name }))}
      classes={classes.map((c: any) => ({ id: c.id, name: c.name, dept_id: c.dept_id, section: c.section }))}
    />
  );
}
