'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

interface Props {
  children: React.ReactNode;
  companyName: string;
  initials: string;
}

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  const pathname = usePathname();
  const active = href === '/company' ? pathname === '/company' : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-metric-label text-sm transition-all ${
        active
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]" style={active ? { fontVariationSettings: '"FILL" 1' } : {}}>{icon}</span>
      {label}
    </Link>
  );
}

export default function CompanyShell({ children, companyName, initials }: Props) {
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
          <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{companyName}</p>
          <p className="font-caption text-on-surface-variant text-xs">Recruiter</p>
        </div>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        <NavLink href="/company" icon="dashboard" label="Dashboard" />
        <NavLink href="/company/jobs" icon="work" label="Posted Jobs" />
        <NavLink href="/company/applications" icon="inbox" label="Applications" />
        <NavLink href="/company/profile" icon="business" label="Company Profile" />
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 bg-surface-container-lowest h-full overflow-y-auto" onClick={() => setSidebarOpen(false)}>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-outline-variant bg-surface-container-lowest sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <span className="font-headline-md text-primary font-bold text-base tracking-tight">AptiLead</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
