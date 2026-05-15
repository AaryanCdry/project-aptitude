'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Get all departments for a college ──────────────────────────────────────
export async function getDepartments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('college_id, role')
    .eq('id', user.id)
    .single();

  let query = supabase
    .from('departments')
    .select(`
      id, name, course_type, semester_count, created_at,
      classes(count)
    `)
    .order('created_at', { ascending: false });

  if (profile?.college_id) {
    query = query.eq('college_id', profile.college_id);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching departments:', JSON.stringify(error));
    return [];
  }

  return (data ?? []).map((d: any) => ({
    ...d,
    classCount: (d.classes as any[])[0]?.count ?? 0,
  }));
}

// ─── Create department ────────────────────────────────────────────────────────
export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();

  const name = formData.get('name') as string;
  const course_type = formData.get('course_type') as string;
  const semester_count = parseInt(formData.get('semester_count') as string) || 6;

  if (!name) return { error: 'Department name is required.' };

  const { error } = await supabase.from('departments').insert({
    name,
    course_type,
    semester_count,
    college_id: profile?.college_id,
  });

  if (error) return { error: error.message };
  revalidatePath('/admin/departments');
  return { success: true };
}

// ─── Get all classes for a department ────────────────────────────────────────
export async function getClasses(deptId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('classes')
    .select(`
      id, name, year, section, created_at,
      dept_id,
      departments(name, course_type),
      sub_admin:users!sub_admin_id(id, name, email)
    `)
    .order('created_at', { ascending: false });

  if (deptId) query = query.eq('dept_id', deptId);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching classes:', JSON.stringify(error));
    return [];
  }

  return data ?? [];
}

// ─── Create class ─────────────────────────────────────────────────────────────
export async function createClass(formData: FormData) {
  const supabase = await createClient();

  const dept_id = formData.get('dept_id') as string;
  const name = formData.get('name') as string;
  const year = parseInt(formData.get('year') as string) || null;
  const section = formData.get('section') as string;

  if (!dept_id || !name) return { error: 'Department and class name are required.' };

  const { error } = await supabase.from('classes').insert({
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
  const supabase = await createClient();
  if (!classIds.length) return {};

  const { data } = await supabase
    .from('student_college')
    .select('class_id')
    .in('class_id', classIds);

  const counts: Record<string, number> = {};
  (data ?? []).forEach((r: any) => {
    counts[r.class_id] = (counts[r.class_id] ?? 0) + 1;
  });
  return counts;
}
