'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getGrade } from '@/lib/adaptive';

export async function getAdminReportData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = profile?.college_id;

  let studentsQ = supabase
    .from('users')
    .select('id, name, email, created_at')
    .eq('role', 'STUDENT')
    .order('name', { ascending: true });
  if (collegeId) studentsQ = (studentsQ as any).eq('college_id', collegeId);
  const { data: students } = await studentsQ;

  const studentIds = (students ?? []).map((s: any) => s.id);
  if (studentIds.length === 0) return { rows: [], totalStudents: 0, totalTests: 0, overallAvg: 0 };

  const { data: tests } = await supabase
    .from('tests')
    .select('id, student_id, type, completed_at')
    .in('student_id', studentIds)
    .eq('status', 'COMPLETED');

  const { data: scores } = await supabase
    .from('scores')
    .select('student_id, domain, score')
    .in('student_id', studentIds)
    .neq('domain', 'OVERALL');

  const scoreMap: Record<string, number[]> = {};
  (scores ?? []).forEach((s: any) => {
    if (!scoreMap[s.student_id]) scoreMap[s.student_id] = [];
    scoreMap[s.student_id].push(s.score);
  });

  const testCount: Record<string, number> = {};
  (tests ?? []).forEach((t: any) => {
    testCount[t.student_id] = (testCount[t.student_id] ?? 0) + 1;
  });

  const rows = (students ?? []).map((s: any) => {
    const sScores = scoreMap[s.id] ?? [];
    const avg = sScores.length
      ? Math.round(sScores.reduce((a: number, b: number) => a + b, 0) / sScores.length)
      : 0;
    return {
      id: s.id,
      name: s.name ?? 'N/A',
      email: s.email ?? '',
      joined: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      testsCompleted: testCount[s.id] ?? 0,
      avgScore: avg,
      grade: getGrade(avg),
    };
  });

  const scored = rows.filter(r => r.avgScore > 0);
  const overallAvg = scored.length
    ? Math.round(scored.reduce((a, r) => a + r.avgScore, 0) / scored.length)
    : 0;

  return {
    rows,
    totalStudents: rows.length,
    totalTests: (tests ?? []).length,
    overallAvg,
  };
}

export async function getAdminSettings() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single();

  return userData;
}

export async function updateAdminSettings(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ name })
    .eq('id', user.id);

  if (error) throw error;
  return { success: true };
}

export async function getStudentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('id', user.id)
    .single();

  return data;
}

export async function updateStudentProfile(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('users')
    .update({ name })
    .eq('id', user.id);

  if (error) throw error;
  return { success: true };
}

export async function getSuperAdminData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: colleges } = await supabase
    .from('colleges')
    .select('id, name, code, status, created_at')
    .order('created_at', { ascending: false });

  const { data: students } = await supabase
    .from('users')
    .select('id, created_at')
    .eq('role', 'STUDENT');

  const { data: tests } = await supabase
    .from('tests')
    .select('id, status')
    .eq('status', 'COMPLETED');

  return {
    colleges: colleges ?? [],
    totalColleges: (colleges ?? []).length,
    totalStudents: (students ?? []).length,
    totalTests: (tests ?? []).length,
  };
}

export async function getSubAdminData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = profile?.college_id;

  let studentsQ = supabase
    .from('users')
    .select('id, name, email, created_at')
    .eq('role', 'STUDENT');
  if (collegeId) studentsQ = (studentsQ as any).eq('college_id', collegeId);
  const { data: students } = await studentsQ;

  const studentIds = (students ?? []).map((s: any) => s.id);

  const { data: scores } = await supabase
    .from('scores')
    .select('student_id, domain, score')
    .in('student_id', studentIds.length ? studentIds : ['none'])
    .neq('domain', 'OVERALL');

  const scoreMap: Record<string, number[]> = {};
  (scores ?? []).forEach((s: any) => {
    if (!scoreMap[s.student_id]) scoreMap[s.student_id] = [];
    scoreMap[s.student_id].push(s.score);
  });

  const rows = (students ?? []).map((s: any) => {
    const sScores = scoreMap[s.id] ?? [];
    const avg = sScores.length
      ? Math.round(sScores.reduce((a: number, b: number) => a + b, 0) / sScores.length)
      : 0;
    return { id: s.id, name: s.name, email: s.email, avgScore: avg };
  });

  return { students: rows };
}

