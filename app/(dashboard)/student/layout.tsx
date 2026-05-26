import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import LogoutButton from '@/components/LogoutButton';

function calcStreak(completedAts: string[]): number {
  if (completedAts.length === 0) return 0;
  const dateSet = new Set(completedAts.map(d => d.slice(0, 10))); // YYYY-MM-DD
  const toKey = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  // Streak must include today or yesterday to be alive
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
        <div className="p-6 flex items-center gap-3 border-b border-outline-variant">
          <div className="bg-primary rounded-full size-10 flex items-center justify-center text-on-primary font-bold text-sm">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-on-surface font-headline-md text-lg truncate">{name}</h1>
            <p className="text-on-surface-variant font-caption">Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="/student">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>dashboard</span>
            Dashboard
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="/assessment">
            <span className="material-symbols-outlined">quiz</span>
            Take Test
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="/student/progress">
            <span className="material-symbols-outlined">analytics</span>
            My Progress
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="/student/leaderboard">
            <span className="material-symbols-outlined">leaderboard</span>
            Leaderboard
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="/student/certificates">
            <span className="material-symbols-outlined">workspace_premium</span>
            Certificates
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="/student/profile">
            <span className="material-symbols-outlined">person</span>
            Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-outline-variant flex flex-col gap-1">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary md:hidden cursor-pointer">menu</span>
            <h2 className="text-on-surface font-headline-md tracking-tight">Welcome back, {name.split(' ')[0]}!</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant font-body-md transition-shadow" placeholder="Search assessments..." type="text" />
            </div>
            <div className="hidden lg:flex items-center gap-4 text-sm font-metric-label bg-surface-container rounded-full px-4 py-1.5 border border-outline-variant">
              <div className="flex items-center gap-1 text-tertiary-container">
                <span className="material-symbols-outlined text-base">local_fire_department</span>
                <span>{streak} Day Streak</span>
              </div>
              <div className="w-px h-4 bg-outline-variant"></div>
              <div className="flex items-center gap-1 text-secondary-container">
                <span className="material-symbols-outlined text-base">monetization_on</span>
                <span className="text-on-surface">{totalPoints.toLocaleString()} Pts</span>
              </div>
            </div>
            <Link href="/student/profile" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm hover:ring-2 ring-primary transition-all">
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
