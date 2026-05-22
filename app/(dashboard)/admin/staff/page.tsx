import { getStaff } from '@/app/actions/staff';
import { getCallerScope } from '@/app/actions/scope';
import StaffClient from './StaffClient';

export default async function StaffPage() {
  const [data, scope] = await Promise.all([getStaff(), getCallerScope()]);
  return <StaffClient initialData={data} role={scope.role} />;
}
