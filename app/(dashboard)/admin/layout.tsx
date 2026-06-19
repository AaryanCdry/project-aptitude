import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessDashboard } from '@/lib/auth/access';
import { getRoleHome } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import AdminShell from './AdminShell';
import { getInitials } from '@/lib/utils';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;
  if (!canAccessDashboard('/admin', role)) {
    redirect(getRoleHome(role) ?? '/login?error=profile');
  }

  const isHOD = role === 'SUB_ADMIN';
  const roleLabel = isHOD ? 'HOD' : 'Principal';

  const name = profile?.name ?? user?.email ?? roleLabel;
  const initials = getInitials(name);

  return (
    <AdminShell name={name} initials={initials} roleLabel={roleLabel} isHOD={isHOD}>
      {children}
    </AdminShell>
  );
}
