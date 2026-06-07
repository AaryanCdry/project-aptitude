'use client';

import { useState } from 'react';
import LogoutButton from '@/components/LogoutButton';
import NavLink from '@/components/NavLink';

interface Props {
  children: React.ReactNode;
  name: string;
  initials: string;
  roleLabel: string;
  isHOD: boolean;
}

export default function AdminShell({ children, name, initials, roleLabel, isHOD }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-outline-variant">
        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
        <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptitudePro</span>
      </div>

      <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant">
        <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
          <p className="font-caption text-on-surface-variant text-xs">{roleLabel}</p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label="Close menu"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto" onClick={() => setSidebarOpen(false)}>
        <NavLink href="/admin" icon="dashboard" label="Overview" exact />
        <NavLink href="/admin/questions" icon="quiz" label="Questions" />
        <NavLink href="/admin/assessments" icon="calendar_month" label="Scheduling" />
        <NavLink href="/admin/finals" icon="workspace_premium" label="Final Exams" />
        <NavLink href="/admin/enrollment" icon="group_add" label="Enrollment" />
        {!isHOD && <NavLink href="/admin/departments" icon="account_tree" label="Departments" />}
        <NavLink href="/admin/classes" icon="meeting_room" label="Classes" />
        <NavLink href="/admin/batches" icon="groups" label="Batches" />
        <NavLink href="/admin/staff" icon="badge" label="Staff" />
        <NavLink href="/admin/reports" icon="assessment" label="Reports" />
        {!isHOD && <NavLink href="/admin/settings" icon="settings" label="Settings" />}
        <NavLink href="/admin/profile" icon="person" label="Profile" />
      </nav>

      <div className="p-3 border-t border-outline-variant">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest text-primary shrink-0 sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-surface-container-lowest text-primary h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 -ml-1 rounded-lg text-primary hover:bg-surface-container transition-colors"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptitudePro</span>
        </header>

        <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
