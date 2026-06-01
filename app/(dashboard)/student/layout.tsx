import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import StudentShell from './StudentShell';

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
    <StudentShell name={name} initials={initials} streak={streak} totalPoints={totalPoints}>
      {children}
    </StudentShell>
  );
}
