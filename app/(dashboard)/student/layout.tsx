import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessDashboard } from '@/lib/auth/access';
import { getRoleHome } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import StudentShell from './StudentShell';
import { getInitials } from '@/lib/utils';

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
  if (!user) redirect('/login');

  const adminClient = createAdminClient();
  const { data: userRow } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!canAccessDashboard('/student', userRow?.role)) {
    redirect(getRoleHome(userRow?.role) ?? '/login?error=profile');
  }

  const [{ data: profile }, { data: completedTests }, { data: classRow }] = await Promise.all([
    adminClient.from('users').select('name, email, total_points').eq('id', user.id).single(),
    adminClient.from('tests').select('completed_at').eq('student_id', user.id).eq('status', 'COMPLETED').not('completed_at', 'is', null),
    adminClient.from('users').select('classes!class_id(name, year, section, batches!batch_id(name), academic_years!academic_year_id(name))').eq('id', user.id).single(),
  ]);

  const name = profile?.name ?? user?.email ?? 'Student';
  const initials = getInitials(name);
  const totalPoints = profile?.total_points ?? 0;
  const streak = calcStreak((completedTests ?? []).map((t: any) => t.completed_at as string));

  const cls = (classRow as any)?.classes ?? null;
  const className: string | null = cls?.name ?? null;
  const batchName: string | null = cls?.batches?.name ?? null;
  const academicYearName: string | null = cls?.academic_years?.name ?? null;

  return (
    <StudentShell name={name} initials={initials} streak={streak} totalPoints={totalPoints} className={className} batchName={batchName} academicYearName={academicYearName}>
      {children}
    </StudentShell>
  );
}
