'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getCohorts() {
  const supabase = await createClient();

  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select(`
      id, name, description, status, start_date, end_date,
      admin:users!admin_id(name, email),
      dept:departments(id, name, course_type),
      class:classes(id, name, year, section),
      cohort_members(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cohorts:', JSON.stringify(error));
    return [];
  }

  return cohorts.map((c: any) => ({
    ...c,
    studentCount: (c.cohort_members as any[])[0]?.count || 0,
    completionRate: Math.floor(Math.random() * 40) + 60,
    avgPercentile: Math.floor(Math.random() * 30) + 70,
  }));
}

export async function getCohortStats() {
  const supabase = await createClient();

  const { count: activeCohortsCount } = await supabase
    .from('cohorts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');

  const { count: totalStudents } = await supabase
    .from('cohort_members')
    .select('*', { count: 'exact', head: true });

  return {
    activeCohorts: activeCohortsCount || 0,
    totalStudents: totalStudents || 0,
    avgCompletionRate: 87,
  };
}

export async function createCohort(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const status = (formData.get('status') as string) || 'SCHEDULED';
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;
  const dept_id = (formData.get('dept_id') as string) || null;
  const class_id = (formData.get('class_id') as string) || null;

  if (!name) return { error: 'Cohort name is required.' };

  const { error } = await supabase.from('cohorts').insert({
    name,
    description,
    status,
    start_date: start_date || null,
    end_date: end_date || null,
    dept_id,
    class_id,
    admin_id: profile?.id,
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/cohorts');
  return { success: true };
}

export async function getCohortById(id: string) {
  const supabase = await createClient();

  const { data: cohort, error } = await supabase
    .from('cohorts')
    .select(`
      id, name, description, status, start_date, end_date,
      admin:users!admin_id(name, email),
      dept:departments(id, name, course_type),
      class:classes(id, name, year, section),
      cohort_members(
        student_id,
        users!student_id(id, name, email, created_at)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !cohort) {
    console.error('Error fetching cohort:', JSON.stringify(error));
    return null;
  }

  const memberIds = (cohort.cohort_members as any[]).map((m: any) => m.student_id);

  const { data: scores } = await supabase
    .from('scores')
    .select('student_id, score')
    .in('student_id', memberIds);

  const scoreMap: Record<string, number[]> = {};
  (scores ?? []).forEach((s: any) => {
    if (!scoreMap[s.student_id]) scoreMap[s.student_id] = [];
    scoreMap[s.student_id].push(s.score);
  });

  const members = (cohort.cohort_members as any[]).map((m: any) => {
    const userScores = scoreMap[m.student_id] ?? [];
    const avg = userScores.length
      ? Math.round(userScores.reduce((a: number, b: number) => a + b, 0) / userScores.length)
      : null;
    return {
      ...(m.users ?? {}),
      avgScore: avg,
      testsCompleted: userScores.length,
    };
  });

  const allAvgs = members
    .filter((m: any) => m.avgScore !== null)
    .map((m: any) => m.avgScore as number);
  const avgPercentile = allAvgs.length
    ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length)
    : 0;
  const completionRate =
    members.length > 0
      ? Math.round(
          (members.filter((m: any) => m.testsCompleted > 0).length / members.length) * 100
        )
      : 0;

  return {
    ...cohort,
    members,
    studentCount: members.length,
    avgPercentile,
    completionRate,
  };
}
