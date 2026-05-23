import { notFound } from 'next/navigation';
import { canViewStudent, getCallerScope } from '@/app/actions/scope';
import StudentDashboardContent from '@/app/(dashboard)/student/StudentDashboardContent';

export default async function AdminStudentDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [allowed, scope] = await Promise.all([canViewStudent(id), getCallerScope()]);
  if (!allowed || !scope.role) notFound();

  return (
    <StudentDashboardContent
      studentId={id}
      viewerMode={{ role: scope.role, backHref: '/admin/enrollment' }}
    />
  );
}
