'use client';

import { useState } from 'react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import NavLink from '@/components/NavLink';

interface Props {
  children: React.ReactNode;
  name: string;
  initials: string;
  streak: number;
  totalPoints: number;
  className?: string | null;
  batchName?: string | null;
  academicYearName?: string | null;
}

export default function StudentShell({ children, name, initials, streak, totalPoints, className, batchName, academicYearName }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const firstName = name.split(' ')[0];

  const sidebarContent = (
    <>
      {/* Wordmark */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-outline-variant">
        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
        <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptiLead</span>
      </div>

      {/* User avatar */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant">
        <div className="bg-primary rounded-full size-9 flex items-center justify-center text-on-primary font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-on-surface font-metric-label text-sm font-semibold truncate">{name}</p>
          {academicYearName ? (
            <p className="text-on-surface-variant font-caption text-xs truncate">{academicYearName}</p>
          ) : className ? (
            <p className="text-on-surface-variant font-caption text-xs truncate">
              {className}{batchName ? ` · ${batchName}` : ''}
            </p>
          ) : (
            <p className="text-on-surface-variant font-caption text-xs">Student Portal</p>
          )}
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto md:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto" onClick={() => setSidebarOpen(false)}>
        <NavLink href="/student" icon="dashboard" label="Dashboard" exact />
        <NavLink href="/assessment" icon="quiz" label="Take Test" />
        <NavLink href="/student/progress" icon="analytics" label="My Progress" />
        <NavLink href="/student/leaderboard" icon="leaderboard" label="Leaderboard" />
        <NavLink href="/student/finals" icon="military_tech" label="Final Exams" />
        <NavLink href="/student/certificates" icon="workspace_premium" label="Certificates" />
        <NavLink href="/student/jobs" icon="work" label="Jobs" />
        <NavLink href="/student/profile" icon="person" label="Profile" />
      </nav>

      <div className="p-3 border-t border-outline-variant">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar panel */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-surface-container-lowest h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 -ml-1 rounded-lg text-primary hover:bg-surface-container transition-colors"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <h2 className="text-on-surface font-headline-md text-lg tracking-tight">Welcome back, {firstName}!</h2>
          </div>
          <div className="flex items-center gap-3">
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
