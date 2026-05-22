import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';

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
      <nav className="hidden md:flex flex-col py-gutter px-4 space-y-2 docked h-screen left-0 w-64 border-r border-outline-variant bg-surface-container-low text-primary flex-shrink-0 sticky top-0">
        <div className="mb-6 px-4 pt-6">
          <span className="text-headline-md font-headline-md text-primary font-bold">AptitudePro</span>
        </div>
        <div className="flex items-center space-x-3 px-4 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{name}</p>
            <p className="font-caption text-on-surface-variant text-xs">{roleLabel}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>dashboard</span>
            <span>Overview</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/questions">
            <span className="material-symbols-outlined">quiz</span>
            <span>Questions</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/cohorts">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>group</span>
            <span>Cohorts</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/assessments">
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Scheduling</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/finals">
            <span className="material-symbols-outlined">workspace_premium</span>
            <span>Final Exams</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/enrollment">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>group_add</span>
            <span>Enrollment</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/departments">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>account_tree</span>
            <span>Departments</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/classes">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>meeting_room</span>
            <span>Classes</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/mapping">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>hub</span>
            <span>Mapping</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/staff">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>badge</span>
            <span>Staff</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/mentors">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>school</span>
            <span>Mentors</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/reports">
            <span className="material-symbols-outlined">assessment</span>
            <span>Reports</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/settings">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-lg" href="/admin/profile">
            <span className="material-symbols-outlined">person</span>
            <span>Profile</span>
          </Link>
        </div>
        <div className="pt-4 border-t border-outline-variant">
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
