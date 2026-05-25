import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user?.id ?? '')
    .single();

  const name = profile?.name ?? user?.email ?? 'Mentor';
  const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-background">
      <nav className="hidden md:flex flex-col py-gutter px-4 space-y-2 h-screen left-0 w-64 bg-surface-container-low border-r border-outline-variant flex-shrink-0 sticky top-0">
        <div className="mb-6 px-4 pt-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
          <span className="text-headline-md font-headline-md text-primary">AptitudePro</span>
        </div>

        <div className="flex flex-col space-y-1 flex-1">
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/mentor">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/mentor/classes">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
            <span>My Classes</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/mentor/students">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
            <span>My Students</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/mentor/proctor">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>security</span>
            <span>Proctoring</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/mentor/assessments">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>quiz</span>
            <span>Assessments</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/schedule-test">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>add_circle</span>
            <span>Schedule Test</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/mentor/questions">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>help</span>
            <span>Question Bank</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/mentor/certificates">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
            <span>Certificates</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/mentor/profile">
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </Link>
        </div>

        <div className="mt-auto pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
              <p className="font-caption text-on-surface-variant text-xs">Mentor</p>
            </div>
          </div>
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
