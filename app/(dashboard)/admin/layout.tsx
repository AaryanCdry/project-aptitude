import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user?.id ?? '')
    .single();

  const role = profile?.role ?? 'ADMIN';
  const isHOD = role === 'SUB_ADMIN';
  const roleLabel = isHOD ? 'HOD' : 'Principal';

  const name = profile?.name ?? user?.email ?? roleLabel;
  const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <AdminShell name={name} initials={initials} roleLabel={roleLabel} isHOD={isHOD}>
      {children}
    </AdminShell>
  );
}
