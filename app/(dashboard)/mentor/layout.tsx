import React from 'react';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';
import NavLink from '@/components/NavLink';
import { getInitials } from '@/lib/utils';

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user?.id ?? '')
    .single();

  const name = profile?.name ?? user?.email ?? 'Mentor';
  const initials = getInitials(name);

  return (
    <div className="flex h-screen bg-background">
      <nav className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Wordmark */}
        <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
          <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptitudePro</span>
        </div>

        {/* User info */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant">
          <div className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
            <p className="font-caption text-on-surface-variant text-xs">Mentor</p>
          </div>
        </div>

        <div className="flex-1 p-3 flex flex-col gap-0.5">
          <NavLink href="/mentor" icon="dashboard" label="Dashboard" exact />
          <NavLink href="/mentor/classes" icon="meeting_room" label="My Classes" />
          <NavLink href="/mentor/students" icon="group" label="My Students" />
          <NavLink href="/mentor/proctor" icon="security" label="Proctoring" />
          <NavLink href="/mentor/assessments" icon="quiz" label="Assessments" />
          <NavLink href="/schedule-test" icon="add_circle" label="Schedule Test" />
          <NavLink href="/mentor/questions" icon="help" label="Question Bank" />
          <NavLink href="/mentor/certificates" icon="workspace_premium" label="Certificates" />
          <NavLink href="/mentor/jobs" icon="work" label="Jobs" />
          <NavLink href="/mentor/profile" icon="person" label="Profile" />
        </div>

        <div className="p-3 border-t border-outline-variant">
          <LogoutButton />
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
