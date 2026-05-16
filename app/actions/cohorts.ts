'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getStudentCohortData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from('cohort_members')
    .select(`
      cohort_id,
      cohorts!cohort_id(
        id, name, description, status, start_date, end_date,
        dept:departments(name, course_type),
        class:classes(name, year, section)
      )
    `)
    .eq('student_id', user.id)
    .limit(1);

  if (!memberships || memberships.length === 0) return null;
  return (memberships[0] as any).cohorts ?? null;
}

export async function getCohorts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = profile?.college_id ?? null;

  let query = supabase
    .from('cohorts')
    .select(`
      id, name, description, status, start_date, end_date,
      admin:users!admin_id(name, email),
      dept:departments(id, name, course_type),
      class:classes(id, name, year, section),
      cohort_members(student_id)
    `)
    .order('created_at', { ascending: false });
  if (collegeId) query = (query as any).eq('college_id', collegeId);

  const { data: cohorts, error } = await query;

  if (error) {
    console.error('Error fetching cohorts:', JSON.stringify(error));
    return [];
  }

  // Batch-fetch scores for all members across all cohorts in one query
  const allStudentIds = [
    ...new Set(
      (cohorts ?? []).flatMap((c: any) =>
        (c.cohort_members as any[]).map((m: any) => m.student_id)
      )
    ),
  ];

  const { data: allScores } = allStudentIds.length > 0
    ? await supabase.from('scores').select('student_id, score').in('student_id', allStudentIds)
    : { data: [] };

  const studentScoreMap: Record<string, number[]> = {};
  (allScores ?? []).forEach((s: any) => {
    if (!studentScoreMap[s.student_id]) studentScoreMap[s.student_id] = [];
    studentScoreMap[s.student_id].push(s.score);
  });

  return (cohorts ?? []).map((c: any) => {
    const memberIds: string[] = (c.cohort_members as any[]).map((m: any) => m.student_id);
    const count = memberIds.length;

    const membersWithScores = memberIds.filter((id) => (studentScoreMap[id] ?? []).length > 0);
    const completionRate = count > 0 ? Math.round((membersWithScores.length / count) * 100) : 0;

    const allMemberScores = memberIds.flatMap((id) => studentScoreMap[id] ?? []);
    const avgPercentile =
      allMemberScores.length > 0
        ? Math.round(allMemberScores.reduce((a: number, b: number) => a + b, 0) / allMemberScores.length)
        : 0;

    return { ...c, studentCount: count, avgPercentile, completionRate };
  });
}

export async function getCohortStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { activeCohorts: 0, totalStudents: 0, avgCompletionRate: 0, newThisMonth: 0 };

  const { data: profile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = profile?.college_id ?? null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Run all count queries in parallel
  let activeQ = supabase.from('cohorts').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
  if (collegeId) activeQ = (activeQ as any).eq('college_id', collegeId);

  let newQ = supabase.from('cohorts').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString());
  if (collegeId) newQ = (newQ as any).eq('college_id', collegeId);

  let cohortIdsQ = supabase.from('cohorts').select('id');
  if (collegeId) cohortIdsQ = (cohortIdsQ as any).eq('college_id', collegeId);

  const [{ count: activeCohortsCount }, { count: newThisMonth }, { data: collegeCohorts }] =
    await Promise.all([activeQ, newQ, cohortIdsQ]);

  const cohortIds = (collegeCohorts ?? []).map((c: any) => c.id);

  if (cohortIds.length === 0) {
    return { activeCohorts: activeCohortsCount || 0, totalStudents: 0, avgCompletionRate: 0, newThisMonth: newThisMonth || 0 };
  }

  // Count unique students and those with at least one score
  const { data: members } = await supabase
    .from('cohort_members')
    .select('student_id')
    .in('cohort_id', cohortIds);

  const uniqueStudentIds = [...new Set((members ?? []).map((m: any) => m.student_id))];

  const { data: scoredStudents } = uniqueStudentIds.length > 0
    ? await supabase
        .from('scores')
        .select('student_id')
        .in('student_id', uniqueStudentIds)
    : { data: [] };

  const studentsWithScores = new Set((scoredStudents ?? []).map((s: any) => s.student_id)).size;
  const avgCompletionRate =
    uniqueStudentIds.length > 0
      ? Math.round((studentsWithScores / uniqueStudentIds.length) * 100)
      : 0;

  return {
    activeCohorts: activeCohortsCount || 0,
    totalStudents: uniqueStudentIds.length,
    avgCompletionRate,
    newThisMonth: newThisMonth || 0,
  };
}

export async function createCohort(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('users')
    .select('id, college_id')
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

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('cohorts').insert({
    name,
    description,
    status,
    start_date: start_date || null,
    end_date: end_date || null,
    dept_id,
    class_id,
    admin_id: profile?.id,
    college_id: profile?.college_id ?? null,
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

// ─── Cohort Assessments ───────────────────────────────────────────────────────

export async function getCohortAssessments(cohortId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cohort_assessments')
    .select('id, title, domain, instructions, due_date, created_at, users!created_by(name)')
    .eq('cohort_id', cohortId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('getCohortAssessments error:', error.message);
    return [];
  }
  return (data ?? []).map((a: any) => ({
    ...a,
    createdByName: a.users?.name ?? 'Admin',
  }));
}

export async function scheduleCohortAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const cohort_id = formData.get('cohort_id') as string;
  const title = formData.get('title') as string;
  const domain = (formData.get('domain') as string) || null;
  const instructions = (formData.get('instructions') as string) || null;
  const due_date = (formData.get('due_date') as string) || null;

  if (!cohort_id || !title) return { error: 'Cohort and title are required.' };

  const { error } = await supabase.from('cohort_assessments').insert({
    cohort_id,
    title,
    domain,
    instructions,
    due_date: due_date ? new Date(due_date).toISOString() : null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/cohorts/${cohort_id}`);
  return { success: true };
}

export async function deleteCohortAssessment(assessmentId: string, cohortId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('cohort_assessments')
    .delete()
    .eq('id', assessmentId);

  if (error) return { error: error.message };
  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { success: true };
}

export async function getStudentAssignedAssessments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Find all cohorts the student belongs to
  const { data: memberships } = await supabase
    .from('cohort_members')
    .select('cohort_id')
    .eq('student_id', user.id);

  const cohortIds = (memberships ?? []).map((m: any) => m.cohort_id);
  if (cohortIds.length === 0) return [];

  const { data, error } = await supabase
    .from('cohort_assessments')
    .select('id, title, domain, instructions, due_date, cohort_id, cohorts!cohort_id(name)')
    .in('cohort_id', cohortIds)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) return [];

  // Check which ones the student has a completed test for (rough match by domain + date)
  const { data: completedTests } = await supabase
    .from('tests')
    .select('id, type, completed_at, scores(domain)')
    .eq('student_id', user.id)
    .eq('status', 'COMPLETED');

  const completedDomains = new Set<string>();
  (completedTests ?? []).forEach((t: any) => {
    (t.scores ?? []).forEach((s: any) => {
      if (s.domain && s.domain !== 'OVERALL') completedDomains.add(s.domain);
    });
  });

  return (data ?? []).map((a: any) => {
    const now = new Date();
    const due = a.due_date ? new Date(a.due_date) : null;
    const isOverdue = due ? due < now : false;
    const isDomainDone = a.domain ? completedDomains.has(a.domain) : false;
    return {
      ...a,
      cohortName: (a.cohorts as any)?.name ?? '',
      isOverdue,
      isDomainDone,
    };
  });
}
