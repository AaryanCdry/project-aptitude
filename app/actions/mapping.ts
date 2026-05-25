'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

async function getCallerCollegeId(): Promise<string | null> {
  const scope = await getCallerScope();
  return scope.collegeId;
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

// ─── Addable students for a class (scope-aware) ─────────────────────────────
// Returns enrolled students the caller may add to this class — same college
// (and same department, for HOD) and not already in this class.
export async function getAddableStudentsForClass(classId: string) {
  const scope = await getCallerScope();
  if (!scope.userId || !scope.collegeId) return [];

  const adminClient = createAdminClient();
  const { data: cls } = await adminClient
    .from('classes')
    .select('id, dept_id, departments!dept_id(college_id)')
    .eq('id', classId)
    .single();
  if (!cls) return [];
  if (((cls as any).departments?.college_id) !== scope.collegeId) return [];
  if (scope.role === 'SUB_ADMIN' && cls.dept_id !== scope.departmentId) return [];

  let q = adminClient
    .from('users')
    .select(`
      id, name, email, registration_id, section, semester, class_id, department_id,
      classes!class_id(name, year),
      departments!department_id(name)
    `)
    .eq('role', 'STUDENT')
    .eq('college_id', scope.collegeId)
    .or(`class_id.neq.${classId},class_id.is.null`)
    .order('name', { ascending: true });

  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    q = q.eq('department_id', scope.departmentId);
  }

  const { data } = await q;
  return (data ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    registration_id: u.registration_id,
    section: u.section,
    semester: u.semester ?? null,
    currentClassName: (u.classes as any)?.name ?? null,
    currentClassYear: (u.classes as any)?.year ?? null,
    currentDeptName: (u.departments as any)?.name ?? null,
  }));
}

// ─── Add (move) selected students into a class ───────────────────────────────
// Updates users.class_id (and department_id to match the class's dept). Each
// student must be within caller scope, otherwise it is silently dropped.
export async function addStudentsToClass(classId: string, studentIds: string[]) {
  const scope = await getCallerScope();
  if (!scope.userId || !scope.collegeId) return { error: 'Not authenticated' };
  if (studentIds.length === 0) return { error: 'No students selected.' };

  const adminClient = createAdminClient();
  const { data: cls } = await adminClient
    .from('classes')
    .select('id, dept_id, departments!dept_id(college_id)')
    .eq('id', classId)
    .single();
  if (!cls) return { error: 'Class not found.' };
  if (((cls as any).departments?.college_id) !== scope.collegeId) return { error: 'Class outside your college.' };
  if (scope.role === 'SUB_ADMIN' && cls.dept_id !== scope.departmentId) {
    return { error: 'Class outside your department.' };
  }

  // Filter studentIds to those actually within scope
  const { data: candidates } = await adminClient
    .from('users')
    .select('id, college_id, department_id')
    .in('id', studentIds)
    .eq('role', 'STUDENT')
    .eq('college_id', scope.collegeId);

  const allowed = (candidates ?? []).filter((s: any) =>
    scope.role !== 'SUB_ADMIN' || s.department_id === scope.departmentId,
  );
  if (allowed.length === 0) return { error: 'No valid students to add.' };

  const ids = allowed.map((s: any) => s.id);
  const { error } = await adminClient
    .from('users')
    .update({ class_id: classId, department_id: cls.dept_id })
    .in('id', ids);
  if (error) return { error: error.message };

  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath('/admin/classes');
  revalidatePath('/admin/enrollment');
  return { success: true as const, added: ids.length };
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

  const allStudentIds = students.map((s: any) => s.id);

  // Fetch already-existing members so we only insert new ones (no unique constraint needed)
  const { data: existing } = await adminClient
    .from('cohort_members')
    .select('student_id')
    .eq('cohort_id', cohortId)
    .in('student_id', allStudentIds);
  const existingSet = new Set((existing ?? []).map((r: any) => r.student_id));
  const newRows = allStudentIds
    .filter((id) => !existingSet.has(id))
    .map((id) => ({ student_id: id, cohort_id: cohortId }));

  if (newRows.length === 0) return { success: true as const, added: 0 };

  let added = 0;
  for (let i = 0; i < newRows.length; i += 500) {
    const chunk = newRows.slice(i, i + 500);
    const { error } = await adminClient.from('cohort_members').insert(chunk);
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

  const allStudentIds = students.map((s: any) => s.id);

  // Fetch already-existing members to avoid duplicates (no unique constraint needed)
  const { data: existing } = await adminClient
    .from('cohort_members')
    .select('student_id')
    .eq('cohort_id', cohortId)
    .in('student_id', allStudentIds);
  const existingSet = new Set((existing ?? []).map((r: any) => r.student_id));
  const newRows = allStudentIds
    .filter((id) => !existingSet.has(id))
    .map((id) => ({ student_id: id, cohort_id: cohortId }));

  if (newRows.length === 0) return { success: true as const, added: 0, source };

  let added = 0;
  for (let i = 0; i < newRows.length; i += 500) {
    const chunk = newRows.slice(i, i + 500);
    const { error } = await adminClient.from('cohort_members').insert(chunk);
    if (error) return { error: error.message };
    added += chunk.length;
  }

  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { success: true as const, added, source };
}

// ─── Mapping overview ─────────────────────────────────────────────────────────

export async function getMappingOverview() {
  const adminClient = createAdminClient();
  const scope = await getCallerScope();
  if (!scope.collegeId) return [];

  let deptsQ = adminClient.from('departments').select('id, name, course_type').eq('college_id', scope.collegeId);
  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    deptsQ = deptsQ.eq('id', scope.departmentId);
  }

  const [{ data: departments }, { data: classes }, { data: cohorts }, { data: studentRows }] =
    await Promise.all([
      deptsQ,
      adminClient
        .from('classes')
        .select('id, name, year, section, dept_id')
        .order('name'),
      adminClient
        .from('cohorts')
        .select('id, name, status, class_id')
        .eq('college_id', scope.collegeId),
      (() => {
        let q = adminClient
          .from('users')
          .select('class_id')
          .eq('role', 'STUDENT')
          .eq('college_id', scope.collegeId!);
        if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
          q = q.eq('department_id', scope.departmentId);
        }
        return q;
      })(),
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
