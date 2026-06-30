import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessDashboard } from '@/lib/auth/access';
import { getRoleHome } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { getInitials } from '@/lib/utils';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single();

  if (!canAccessDashboard('/super', profile?.role)) {
    redirect(getRoleHome(profile?.role) ?? '/login?error=profile');
  }

  const name = profile?.name ?? user?.email ?? 'Super Admin';
  const initials = getInitials(name);

  return (
    <div className="flex h-screen bg-background">
      <nav className="hidden md:flex flex-col py-gutter px-4 h-screen w-64 bg-surface-container-low border-r border-outline-variant shrink-0 sticky top-0">
        <div className="mb-6 px-4 pt-6">
          <span className="text-headline-md font-headline-md text-error font-bold">AptiLead</span>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
            <p className="font-caption text-on-surface-variant text-xs">Super Admin</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/super">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/super/colleges">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>business</span>
            <span>Colleges</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/super/analytics">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>analytics</span>
            <span>Analytics</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/super/codes">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>key</span>
            <span>Registration Codes</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/super/settings">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>settings</span>
            <span>Platform Settings</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/super/profile">
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </Link>
        </div>

        <div className="mt-auto pt-4 border-t border-outline-variant px-4 pb-2">
          <span className="bg-error-container text-on-error-container text-xs font-bold px-2.5 py-1 rounded-full">SUPER ADMIN</span>
        </div>
        <div className="px-4 pb-4">
          <LogoutButton />
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
