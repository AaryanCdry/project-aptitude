import React from 'react';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';
import NavLink from '@/components/NavLink';

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
    <div className="flex h-screen bg-background">
      <nav className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest text-primary shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Wordmark */}
        <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
          <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptitudePro</span>
        </div>

        {/* User info */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant">
          <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
            <p className="font-caption text-on-surface-variant text-xs">{roleLabel}</p>
          </div>
        </div>

        <div className="flex-1 p-3 flex flex-col gap-0.5">
          <NavLink href="/admin" icon="dashboard" label="Overview" exact />
          <NavLink href="/admin/questions" icon="quiz" label="Questions" />
          <NavLink href="/admin/assessments" icon="calendar_month" label="Scheduling" />
          <NavLink href="/admin/finals" icon="workspace_premium" label="Final Exams" />
          <NavLink href="/admin/enrollment" icon="group_add" label="Enrollment" />
          {!isHOD && (
            <NavLink href="/admin/departments" icon="account_tree" label="Departments" />
          )}
          <NavLink href="/admin/classes" icon="meeting_room" label="Classes" />
          <NavLink href="/admin/staff" icon="badge" label="Staff" />
          <NavLink href="/admin/reports" icon="assessment" label="Reports" />
          {!isHOD && (
            <NavLink href="/admin/settings" icon="settings" label="Settings" />
          )}
          <NavLink href="/admin/profile" icon="person" label="Profile" />
        </div>

        <div className="p-3 border-t border-outline-variant">
          <LogoutButton />
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto min-h-0 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
