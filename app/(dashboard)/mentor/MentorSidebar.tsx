'use client';

import { useState } from 'react';
import LogoutButton from '@/components/LogoutButton';
import NavLink from '@/components/NavLink';
import NavSectionLabel from '@/components/NavSectionLabel';
import CollapsibleNavSection from '@/components/CollapsibleNavSection';

interface Props {
  children: React.ReactNode;
  name: string;
  initials: string;
}

export default function MentorSidebar({ children, name, initials }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-outline-variant">
        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>neurology</span>
        <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptiLead</span>
      </div>

      <div className="px-5 py-4 flex items-center gap-3 border-b border-outline-variant">
        <div className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
          <p className="font-caption text-on-surface-variant text-xs">Mentor</p>
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
        <NavLink href="/mentor" icon="dashboard" label="Dashboard" exact />

        <NavSectionLabel label="Daily Operations" />
        <NavLink href="/mentor/proctor" icon="security" label="Proctoring" />
        <NavLink href="/mentor/assessments" icon="quiz" label="Assessments" />
        <NavLink href="/schedule-test" icon="add_circle" label="Schedule Test" />
        <NavLink href="/mentor/questions" icon="help" label="Question Bank" />

        <CollapsibleNavSection storageKey="sidebar-setup-collapsed:mentor" label="Setup & Configuration">
          <NavLink href="/mentor/classes" icon="meeting_room" label="My Classes" />
          <NavLink href="/mentor/students" icon="group" label="My Students" />
          <NavLink href="/mentor/certificates" icon="workspace_premium" label="Certificates" />
          <NavLink href="/mentor/jobs" icon="work" label="Jobs" />
        </CollapsibleNavSection>

        <NavLink href="/mentor/profile" icon="person" label="Profile" />
      </nav>

      <div className="p-3 border-t border-outline-variant">
        <LogoutButton />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest shrink-0 sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 max-w-[85vw] bg-surface-container-lowest h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 -ml-1 rounded-lg text-primary hover:bg-surface-container transition-colors"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptiLead</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
