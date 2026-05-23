'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

async function getCallerCollegeId() {
  const scope = await getCallerScope();
  return scope.collegeId;
}

// ─── Get all departments for the caller's scope ─────────────────────────────
export async function getDepartments() {
  const adminClient = createAdminClient();
  const scope = await getCallerScope();
  if (!scope.collegeId) return [];

  let query = adminClient
    .from('departments')
    .select(`id, name, course_type, semester_count, created_at, classes(count)`)
    .eq('college_id', scope.collegeId)
    .order('created_at', { ascending: false });

  // A HOD only sees their own department.
  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    query = query.eq('id', scope.departmentId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching departments:', error.message);
    return [];
  }

  return (data ?? []).map((d: any) => ({
    ...d,
    classCount: (d.classes as any[])[0]?.count ?? 0,
  }));
}

// ─── Create department ────────────────────────────────────────────────────────
export async function createDepartment(formData: FormData) {
  const collegeId = await getCallerCollegeId();
  if (!collegeId) return { error: 'Not authenticated or no college assigned.' };

  const name = formData.get('name') as string;
  const course_type = formData.get('course_type') as string;
  const semester_count = parseInt(formData.get('semester_count') as string) || 6;

  if (!name) return { error: 'Department name is required.' };

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('departments').insert({
    name,
    course_type,
    semester_count,
    college_id: collegeId,
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/departments');
  return { success: true };
}

// ─── Get all classes (scoped to caller's college) ─────────────────────────────
export async function getClasses(deptId?: string) {
  const adminClient = createAdminClient();
  const scope = await getCallerScope();
  if (!scope.collegeId) return [];

  // A HOD is locked to their department regardless of any `deptId` query param.
  const effectiveDeptId =
    scope.role === 'SUB_ADMIN' && scope.departmentId ? scope.departmentId : deptId;

  // Resolve dept IDs that belong to this college (used when no explicit dept filter).
  let deptIds: string[] | null = null;
  if (!effectiveDeptId) {
    const { data: depts } = await adminClient
      .from('departments')
      .select('id')
      .eq('college_id', scope.collegeId);
    deptIds = (depts ?? []).map((d: any) => d.id);
    if (deptIds.length === 0) return [];
  }

  let query = adminClient
    .from('classes')
    .select(`
      id, name, year, section, created_at, dept_id,
      departments(name, course_type),
      sub_admin:users!sub_admin_id(id, name, email)
    `)
    .order('created_at', { ascending: false });

  if (effectiveDeptId) {
    query = query.eq('dept_id', effectiveDeptId);
  } else if (deptIds) {
    query = query.in('dept_id', deptIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching classes:', error.message);
    return [];
  }

  return data ?? [];
}

// ─── Create class ─────────────────────────────────────────────────────────────
export async function createClass(formData: FormData) {
  const collegeId = await getCallerCollegeId();
  if (!collegeId) return { error: 'Not authenticated or no college assigned.' };

  const dept_id = formData.get('dept_id') as string;
  const name = formData.get('name') as string;
  const year = parseInt(formData.get('year') as string) || null;
  const section = formData.get('section') as string;

  if (!dept_id || !name) return { error: 'Department and class name are required.' };

  // Verify the department belongs to this admin's college
  const adminClient = createAdminClient();
  const { data: dept } = await adminClient
    .from('departments')
    .select('college_id')
    .eq('id', dept_id)
    .single();

  if (!dept || dept.college_id !== collegeId) {
    return { error: 'Department does not belong to your college.' };
  }

  const { error } = await adminClient.from('classes').insert({
    dept_id,
    name,
    year,
    section,
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/classes');
  revalidatePath('/admin/departments');
  return { success: true };
}

// ─── Get assigned mentors per class ─────────────────────────────────────────
// Mentor ownership of a class lives in `mentor_classes`, not on the legacy
// `classes.sub_admin_id` column. Returns { classId → [{ id, name }] }.
export async function getClassMentors(classIds: string[]) {
  if (!classIds.length) return {} as Record<string, Array<{ id: string; name: string | null }>>;
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from('mentor_classes')
    .select('class_id, users!mentor_id(id, name)')
    .in('class_id', classIds);

  const byClass: Record<string, Array<{ id: string; name: string | null }>> = {};
  (data ?? []).forEach((r: any) => {
    const u = r.users as any;
    if (!u || !r.class_id) return;
    if (!byClass[r.class_id]) byClass[r.class_id] = [];
    byClass[r.class_id].push({ id: u.id, name: u.name ?? null });
  });
  return byClass;
}

// ─── Get student count per class ─────────────────────────────────────────────
// Students are tracked on `users.class_id` (not the legacy `student_college`
// table, which is empty). Counts come from the users table.
export async function getClassStudentCounts(classIds: string[]) {
  if (!classIds.length) return {};
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from('users')
    .select('class_id')
    .eq('role', 'STUDENT')
    .in('class_id', classIds);

  const counts: Record<string, number> = {};
  (data ?? []).forEach((r: any) => {
    if (r.class_id) counts[r.class_id] = (counts[r.class_id] ?? 0) + 1;
  });
  return counts;
}
