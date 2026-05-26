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
    .select('id, name, email, registration_id, section')
    .eq('class_id', classId)
    .eq('role', 'STUDENT')
    .order('name', { ascending: true });

  const mapped = (students ?? []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    registration_id: u.registration_id,
    section: u.section,
  }));

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

