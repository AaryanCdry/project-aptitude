'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

function generateTempPassword() {
  return Math.random().toString(36).slice(-8) + 'A1!';
}

// ─── List staff in scope ─────────────────────────────────────────────────────

export async function getStaff() {
  const scope = await getCallerScope();
  if (!scope.userId || !scope.collegeId) {
    return { hods: [], mentors: [], departments: [], classes: [] };
  }

  const adminClient = createAdminClient();

  let hodsQ = adminClient
    .from('users')
    .select('id, name, email, created_at, temp_password, department_id, departments!department_id(name)')
    .eq('college_id', scope.collegeId)
    .eq('role', 'SUB_ADMIN')
    .order('created_at', { ascending: false });

  // Mentors don't have department_id; surface via mentor_classes -> classes -> dept_id (for HOD scope)
  let mentorsQ = adminClient
    .from('users')
    .select('id, name, email, created_at, temp_password, mentor_classes!mentor_id(class_id, classes!class_id(id, name, dept_id))')
    .eq('college_id', scope.collegeId)
    .eq('role', 'MENTOR')
    .order('created_at', { ascending: false });

  let deptsQ = adminClient
    .from('departments')
    .select('id, name, course_type')
    .eq('college_id', scope.collegeId)
    .order('name');

  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    deptsQ = deptsQ.eq('id', scope.departmentId);
    hodsQ = hodsQ.eq('department_id', scope.departmentId);
    // For mentors, dept-scope is best-effort via classes; full filter is done in JS below
  }

  // Resolve the in-scope departments first, so classes can be filtered to this
  // college only (classes carry no college_id — they inherit it via dept_id).
  const { data: departments } = await deptsQ;
  const deptIds = (departments ?? []).map((d: any) => d.id);

  const classesQ = deptIds.length > 0
    ? adminClient
        .from('classes')
        .select('id, name, year, section, dept_id, departments!dept_id(name)')
        .in('dept_id', deptIds)
        .order('name')
    : null;

  const [{ data: hods }, { data: mentors }, classesRes] =
    await Promise.all([hodsQ, mentorsQ, classesQ ?? Promise.resolve({ data: [] })]);
  const classes = (classesRes as any).data ?? [];

  // Filter mentors by dept membership when HOD is viewing
  const filteredMentors =
    scope.role === 'SUB_ADMIN' && scope.departmentId
      ? (mentors ?? []).filter((m: any) =>
          (m.mentor_classes ?? []).some((mc: any) => (mc.classes as any)?.dept_id === scope.departmentId)
        )
      : (mentors ?? []);

  return {
    hods: (hods ?? []).map((h: any) => ({
      ...h,
      departmentName: (h.departments as any)?.name ?? null,
    })),
    mentors: filteredMentors.map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      created_at: m.created_at,
      temp_password: m.temp_password,
      classes: (m.mentor_classes ?? []).map((mc: any) => ({
        id: (mc.classes as any)?.id,
        name: (mc.classes as any)?.name,
        dept_id: (mc.classes as any)?.dept_id,
      })),
    })),
    departments: departments ?? [],
    classes: classes ?? [],
  };
}

// ─── Create HOD (SUB_ADMIN) ──────────────────────────────────────────────────

export async function createHOD(formData: FormData) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (scope.role !== 'ADMIN') return { error: 'Only Principal can create HODs.' };
  if (!scope.collegeId) return { error: 'No college context.' };

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const departmentId = formData.get('department_id') as string;

  if (!name || !email || !departmentId) return { error: 'Name, email and department are required.' };

  // Verify department belongs to caller's college
  const adminClient = createAdminClient();
  const { data: dept } = await adminClient
    .from('departments')
    .select('id, college_id')
    .eq('id', departmentId)
    .single();
  if (!dept || dept.college_id !== scope.collegeId) return { error: 'Invalid department.' };

  const tempPassword = generateTempPassword();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: 'SUB_ADMIN' },
  });
  if (authError) return { error: authError.message };

  const userId = authData.user?.id;
  if (!userId) return { error: 'Could not create user.' };

  const { error: userError } = await adminClient.from('users').upsert({
    id: userId,
    email,
    name,
    role: 'SUB_ADMIN',
    college_id: scope.collegeId,
    department_id: departmentId,
    temp_password: tempPassword,
  });
  if (userError) return { error: userError.message };

  revalidatePath('/admin/staff');
  return { success: true as const, tempPassword };
}

// ─── Create Mentor + optionally assign to classes ─────────────────────────────

export async function createMentor(formData: FormData) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!['ADMIN', 'SUB_ADMIN'].includes(scope.role ?? '')) return { error: 'Not authorized.' };
  if (!scope.collegeId) return { error: 'No college context.' };

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const classIdsRaw = (formData.get('class_ids') as string) ?? '';
  const classIds = classIdsRaw.split(',').map(s => s.trim()).filter(Boolean);

  if (!name || !email) return { error: 'Name and email are required.' };

  const adminClient = createAdminClient();

  // If HOD is creating, restrict mentor's classes to their department
  if (scope.role === 'SUB_ADMIN' && classIds.length > 0) {
    const { data: validClasses } = await adminClient
      .from('classes')
      .select('id')
      .in('id', classIds)
      .eq('dept_id', scope.departmentId);
    const validIds = new Set((validClasses ?? []).map((c: any) => c.id));
    if (classIds.some(id => !validIds.has(id))) {
      return { error: 'One or more classes are outside your department.' };
    }
  }

  const tempPassword = generateTempPassword();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: 'MENTOR' },
  });
  if (authError) return { error: authError.message };

  const userId = authData.user?.id;
  if (!userId) return { error: 'Could not create user.' };

  const { error: userError } = await adminClient.from('users').upsert({
    id: userId,
    email,
    name,
    role: 'MENTOR',
    college_id: scope.collegeId,
    temp_password: tempPassword,
  });
  if (userError) return { error: userError.message };

  if (classIds.length > 0) {
    const rows = classIds.map(id => ({ mentor_id: userId, class_id: id }));
    await adminClient.from('mentor_classes').insert(rows);
  }

  revalidatePath('/admin/staff');
  return { success: true as const, tempPassword };
}

// ─── Update mentor's class assignments ───────────────────────────────────────

export async function setMentorClasses(mentorId: string, classIds: string[]) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (!['ADMIN', 'SUB_ADMIN'].includes(scope.role ?? '')) return { error: 'Not authorized.' };

  const adminClient = createAdminClient();

  // Verify mentor belongs to caller's college
  const { data: mentor } = await adminClient
    .from('users')
    .select('id, college_id')
    .eq('id', mentorId)
    .eq('role', 'MENTOR')
    .single();
  if (!mentor || mentor.college_id !== scope.collegeId) return { error: 'Invalid mentor.' };

  // If HOD: restrict class set to their department
  if (scope.role === 'SUB_ADMIN' && classIds.length > 0) {
    const { data: validClasses } = await adminClient
      .from('classes')
      .select('id')
      .in('id', classIds)
      .eq('dept_id', scope.departmentId);
    const validIds = new Set((validClasses ?? []).map((c: any) => c.id));
    if (classIds.some(id => !validIds.has(id))) {
      return { error: 'One or more classes are outside your department.' };
    }
  }

  // Replace assignments: delete then insert
  await adminClient.from('mentor_classes').delete().eq('mentor_id', mentorId);
  if (classIds.length > 0) {
    const rows = classIds.map(id => ({ mentor_id: mentorId, class_id: id }));
    const { error } = await adminClient.from('mentor_classes').insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath('/admin/staff');
  return { success: true as const };
}

// ─── Remove HOD / Mentor (demote to STUDENT, clear scope) ────────────────────

export async function removeStaff(userId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (scope.role !== 'ADMIN') return { error: 'Only Principal can remove staff.' };

  const adminClient = createAdminClient();
  await adminClient.from('mentor_classes').delete().eq('mentor_id', userId);
  await adminClient
    .from('users')
    .update({ role: 'STUDENT', department_id: null })
    .eq('id', userId)
    .eq('college_id', scope.collegeId);

  revalidatePath('/admin/staff');
  return { success: true as const };
}
