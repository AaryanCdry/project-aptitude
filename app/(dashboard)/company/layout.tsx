import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessDashboard } from '@/lib/auth/access';
import { getRoleHome } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import CompanyShell from './CompanyShell';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createAdminClient();
  const { data: userRow } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!canAccessDashboard('/company', userRow?.role)) {
    redirect(getRoleHome(userRow?.role) ?? '/login?error=profile');
  }

  const { data: profile } = await adminClient
    .from('company_profiles')
    .select('company_name')
    .eq('id', user.id)
    .single();

  const companyName = profile?.company_name ?? user.email ?? 'Company';

  return (
    <CompanyShell companyName={companyName} initials={getInitials(companyName)}>
      {children}
    </CompanyShell>
  );
}
