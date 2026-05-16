'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function getCallerCollegeId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  return profile?.college_id ?? null;
}

// ─── Class detail + student roster ────────────────────────────────────────────

export async function getClassWithStudents(classId: string) {
  const adminClient = createAdminClient();
  const collegeId = await getCallerCollegeId();

  const { data: classInfo, error: classError } = await adminClient
    .from('classes')
    .select(`
      id, name, year, section, dept_id,
      departments!dept_id(id, name, course_type, college_id)
    `)
    .eq('id', classId)
    .single();

  if (classError || !classInfo) return null;

  // Verify ownership via college chain
  const dept = (classInfo as any).departments;
  if (collegeId && dept?.college_id !== collegeId) return null;

  const { data: students } = await adminClient
    .from('users')
    .select(`
      id, name, email, registration_id, section,
      cohort_members!student_id(cohort_id, cohorts!cohort_id(id, name))
    `)
    .eq('class_id', classId)
    .eq('role', 'STUDENT')
    .order('name', { ascending: true });

  const mapped = (students ?? []).map((u: any) => {
    const membership = (u.cohort_members as any[])?.[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      registration_id: u.registration_id,
      section: u.section,
      cohortId: membership?.cohort_id ?? null,
      cohortName: membership?.cohorts?.name ?? null,
    };
  });

  const inCohort = mapped.filter((s) => s.cohortId !== null).length;

  return {
    classInfo: {
      id: (classInfo as any).id,
      name: (classInfo as any).name,
      year: (classInfo as any).year,
      section: (classInfo as any).section,
      dept_id: (classInfo as any).dept_id,
      deptName: dept?.name ?? null,
      courseType: dept?.course_type ?? null,
    },
    students: mapped,
    totalStudents: mapped.length,
    inCohort,
    notAssigned: mapped.length - inCohort,
  };
}

// ─── Assign all students in a class to a cohort ───────────────────────────────

export async function assignClassToCohort(classId: string, cohortId: string) {
  const adminClient = createAdminClient();
  const collegeId = await getCallerCollegeId();
  if (!collegeId) return { error: 'Not authenticated' };

  // Verify the cohort belongs to this college
  const { data: cohort } = await adminClient
    .from('cohorts')
    .select('id, college_id, name')
    .eq('id', cohortId)
    .single();
  if (!cohort || cohort.college_id !== collegeId) return { error: 'Cohort not found.' };

  // Fetch student IDs
  const { data: students } = await adminClient
    .from('users')
    .select('id')
    .eq('class_id', classId)
    .eq('role', 'STUDENT');

  if (!students || students.length === 0) return { success: true as const, added: 0 };

  const rows = students.map((s: any) => ({ student_id: s.id, cohort_id: cohortId }));

  // Chunk into 500 to stay under PostgREST limits
  let added = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await adminClient
      .from('cohort_members')
      .upsert(chunk, { onConflict: 'student_id,cohort_id', ignoreDuplicates: true });
    if (error) return { error: error.message };
    added += chunk.length;
  }

  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { success: true as const, added };
}

// ─── Sync cohort members from linked class or department ──────────────────────

export async function syncCohortMembers(cohortId: string) {
  const adminClient = createAdminClient();
  const collegeId = await getCallerCollegeId();
  if (!collegeId) return { error: 'Not authenticated' };

  const { data: cohort } = await adminClient
    .from('cohorts')
    .select('id, college_id, class_id, dept_id')
    .eq('id', cohortId)
    .single();

  if (!cohort || cohort.college_id !== collegeId) return { error: 'Cohort not found.' };

  let studentQuery = adminClient
    .from('users')
    .select('id')
    .eq('role', 'STUDENT')
    .eq('college_id', collegeId);

  let source: 'class' | 'dept' | 'none' = 'none';

  if (cohort.class_id) {
    studentQuery = studentQuery.eq('class_id', cohort.class_id);
    source = 'class';
  } else if (cohort.dept_id) {
    studentQuery = studentQuery.eq('department_id', cohort.dept_id);
    source = 'dept';
  } else {
    return { success: true as const, added: 0, source: 'none' as const };
  }

  const { data: students } = await studentQuery;
  if (!students || students.length === 0) return { success: true as const, added: 0, source };

  const rows = students.map((s: any) => ({ student_id: s.id, cohort_id: cohortId }));

  let added = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await adminClient
      .from('cohort_members')
      .upsert(chunk, { onConflict: 'student_id,cohort_id', ignoreDuplicates: true });
    if (error) return { error: error.message };
    added += chunk.length;
  }

  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { success: true as const, added, source };
}

// ─── Mapping overview ─────────────────────────────────────────────────────────

export async function getMappingOverview() {
  const adminClient = createAdminClient();
  const collegeId = await getCallerCollegeId();
  if (!collegeId) return [];

  const [{ data: departments }, { data: classes }, { data: cohorts }, { data: studentRows }] =
    await Promise.all([
      adminClient.from('departments').select('id, name, course_type').eq('college_id', collegeId),
      adminClient
        .from('classes')
        .select('id, name, year, section, dept_id')
        .order('name'),
      adminClient
        .from('cohorts')
        .select('id, name, status, class_id')
        .eq('college_id', collegeId),
      adminClient
        .from('users')
        .select('class_id')
        .eq('role', 'STUDENT')
        .eq('college_id', collegeId),
    ]);

  // Build class→studentCount map
  const studentCountByClass: Record<string, number> = {};
  (studentRows ?? []).forEach((r: any) => {
    if (r.class_id) studentCountByClass[r.class_id] = (studentCountByClass[r.class_id] ?? 0) + 1;
  });

  // Build class→cohort map (by class_id on cohort)
  const cohortByClass: Record<string, { id: string; name: string; status: string }> = {};
  (cohorts ?? []).forEach((c: any) => {
    if (c.class_id) cohortByClass[c.class_id] = { id: c.id, name: c.name, status: c.status };
  });

  // Get dept IDs of this college's classes
  const deptIds = new Set((departments ?? []).map((d: any) => d.id));

  const classesByDept: Record<string, any[]> = {};
  (classes ?? []).forEach((c: any) => {
    if (!deptIds.has(c.dept_id)) return;
    if (!classesByDept[c.dept_id]) classesByDept[c.dept_id] = [];
    classesByDept[c.dept_id].push({
      classId: c.id,
      className: c.name,
      year: c.year,
      section: c.section,
      studentCount: studentCountByClass[c.id] ?? 0,
      cohort: cohortByClass[c.id] ?? null,
    });
  });

  return (departments ?? []).map((d: any) => ({
    deptId: d.id,
    deptName: d.name,
    courseType: d.course_type,
    classes: classesByDept[d.id] ?? [],
  }));
}
