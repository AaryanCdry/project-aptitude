import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import LogoutButton from '@/components/LogoutButton';
import NavLink from '@/components/NavLink';

function calcStreak(completedAts: string[]): number {
  if (completedAts.length === 0) return 0;
  const dateSet = new Set(completedAts.map(d => d.slice(0, 10)));
  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  let cursor = dateSet.has(toKey(today)) ? new Date(today) : dateSet.has(toKey(yesterday)) ? new Date(yesterday) : null;
  if (!cursor) return 0;
  let count = 0;
  while (dateSet.has(toKey(cursor))) {
    count++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return count;
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminClient = createAdminClient();
  const [{ data: profile }, { data: completedTests }] = await Promise.all([
    adminClient.from('users').select('name, email, total_points').eq('id', user?.id ?? '').single(),
    adminClient.from('tests').select('completed_at').eq('student_id', user?.id ?? '').eq('status', 'COMPLETED').not('completed_at', 'is', null),
  ]);

  const name = profile?.name ?? user?.email ?? 'Student';
  const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
  const totalPoints = profile?.total_points ?? 0;
  const streak = calcStreak((completedTests ?? []).map((t: any) => t.completed_at as string));

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest shrink-0 sticky top-0 h-screen">
        {/* Wordmark */}
        <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-outline-variant">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
          <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptitudePro</span>
        </div>

        {/* User avatar */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant">
          <div className="bg-primary rounded-full size-9 flex items-center justify-center text-on-primary font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-on-surface font-metric-label text-sm font-semibold truncate">{name}</p>
            <p className="text-on-surface-variant font-caption text-xs">Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          <NavLink href="/student" icon="dashboard" label="Dashboard" exact />
          <NavLink href="/assessment" icon="quiz" label="Take Test" />
          <NavLink href="/student/progress" icon="analytics" label="My Progress" />
          <NavLink href="/student/leaderboard" icon="leaderboard" label="Leaderboard" />
          <NavLink href="/student/certificates" icon="workspace_premium" label="Certificates" />
          <NavLink href="/student/profile" icon="person" label="Profile" />
        </nav>

        <div className="p-3 border-t border-outline-variant">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary md:hidden cursor-pointer">menu</span>
            <h2 className="text-on-surface font-headline-md text-lg tracking-tight">Welcome back, {name.split(' ')[0]}!</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block w-60">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-on-surface placeholder:text-on-surface-variant font-body-md transition-shadow outline-none" placeholder="Search assessments..." type="text" />
            </div>
            <div className="hidden lg:flex items-center gap-3 text-sm font-metric-label bg-surface-container rounded-full px-4 py-1.5 border border-outline-variant">
              <div className="flex items-center gap-1.5 text-tertiary">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>local_fire_department</span>
                <span className="text-on-surface">{streak} Day Streak</span>
              </div>
              <div className="w-px h-4 bg-outline-variant" />
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>monetization_on</span>
                <span className="text-on-surface">{totalPoints.toLocaleString()} Pts</span>
              </div>
            </div>
            <Link href="/student/profile" className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm hover:ring-2 ring-primary ring-offset-1 transition-all shrink-0">
              {initials}
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
