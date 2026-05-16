'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

async function getCallerCollegeId() {
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

// ─── Get all departments for a college ──────────────────────────────────────
export async function getDepartments() {
  const adminClient = createAdminClient();
  const collegeId = await getCallerCollegeId();

  let query = adminClient
    .from('departments')
    .select(`id, name, course_type, semester_count, created_at, classes(count)`)
    .order('created_at', { ascending: false });

  if (collegeId) query = query.eq('college_id', collegeId);

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
  const collegeId = await getCallerCollegeId();

  // Resolve dept IDs that belong to this college
  let deptIds: string[] | null = null;
  if (!deptId && collegeId) {
    const { data: depts } = await adminClient
      .from('departments')
      .select('id')
      .eq('college_id', collegeId);
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

  if (deptId) {
    query = query.eq('dept_id', deptId);
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

// ─── Get student count per class ─────────────────────────────────────────────
export async function getClassStudentCounts(classIds: string[]) {
  if (!classIds.length) return {};
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from('student_college')
    .select('class_id')
    .in('class_id', classIds);

  const counts: Record<string, number> = {};
  (data ?? []).forEach((r: any) => {
    counts[r.class_id] = (counts[r.class_id] ?? 0) + 1;
  });
  return counts;
}
