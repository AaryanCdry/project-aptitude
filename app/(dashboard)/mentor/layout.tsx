import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessDashboard } from '@/lib/auth/access';
import { getRoleHome } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import MentorSidebar from './MentorSidebar';

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('name, email, role')
    .eq('id', user.id)
    .single();

  if (!canAccessDashboard('/mentor', profile?.role)) {
    redirect(getRoleHome(profile?.role) ?? '/login?error=profile');
  }

  const name = profile?.name ?? user?.email ?? 'Mentor';
  const initials = getInitials(name);

  return (
    <MentorSidebar name={name} initials={initials}>
      {children}
    </MentorSidebar>
  );
}
