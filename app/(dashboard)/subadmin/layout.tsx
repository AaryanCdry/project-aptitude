import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';

export default async function SubAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user?.id ?? '')
    .single();

  const name = profile?.name ?? user?.email ?? 'Sub Admin';
  const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-background">
      <nav className="hidden md:flex flex-col py-gutter px-4 space-y-2 h-screen left-0 w-64 bg-surface-container-low border-r border-outline-variant flex-shrink-0 sticky top-0">
        <div className="mb-8 px-4 pt-6">
          <span className="text-headline-md font-headline-md text-primary font-bold">AptitudePro</span>
          <p className="font-caption text-on-surface-variant mt-1">Sub Admin Portal</p>
        </div>

        <div className="flex-1 space-y-1">
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/subadmin">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/subadmin/classes">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
            <span>Classes</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/subadmin/reports">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>assessment</span>
            <span>Reports</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="/subadmin/profile">
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </Link>
        </div>

        <div className="mt-auto pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
              <p className="font-caption text-on-surface-variant text-xs">Department Admin</p>
            </div>
          </div>
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
