import { getDepartments, getClasses } from '@/app/actions/departments';
import ManualEnrollmentForm from './ManualEnrollmentForm';

export default async function NewEnrollmentPage() {
  const [departments, classes] = await Promise.all([
    getDepartments(),
    getClasses(),
  ]);

  return (
    <ManualEnrollmentForm
      departments={departments.map(d => ({ id: d.id, name: d.name }))}
      classes={classes.map((c: any) => ({ id: c.id, name: c.name, dept_id: c.dept_id, section: c.section }))}
    />
  );
}
