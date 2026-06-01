'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCallerScope } from './scope';

// ─── Fetch all enrolled students (scoped by caller role) ────────────────────
// ADMIN (Principal)  → all students in college
// SUB_ADMIN (HOD)    → only students in their department
// MENTOR             → only students in their assigned classes

export async function getEnrolledStudents() {
  const scope = await getCallerScope();
  if (!scope.userId) return [];

  let query = createAdminClient()
    .from('users')
    .select(`
      id, name, email, role, created_at, temp_password,
      registration_id, section, semester, department_id, class_id,
      departments!department_id(name),
      classes!class_id(name, year)
    `)
    .eq('role', 'STUDENT')
    .order('created_at', { ascending: false });

  if (scope.collegeId) query = (query as any).eq('college_id', scope.collegeId);

  if (scope.role === 'SUB_ADMIN') {
    if (!scope.departmentId) return [];
    query = (query as any).eq('department_id', scope.departmentId);
  } else if (scope.role === 'MENTOR') {
    if (scope.classIds.length === 0) return [];
    query = (query as any).in('class_id', scope.classIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching students:', error.message ?? JSON.stringify(error));
    return [];
  }

  // Fetch last_sign_in_at for all students from auth.users in one call
  const adminClient = createAdminClient();
  const authMap: Record<string, string | null> = {};
  try {
    const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    (authUsers ?? []).forEach((au: any) => {
      authMap[au.id] = au.last_sign_in_at ?? null;
    });
  } catch {
    // If auth fetch fails, fall through — status will degrade to INVITED/INACTIVE
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (data ?? []).map((u: any, i: number) => {
    const year = new Date(u.created_at).getFullYear();
    const lastSignIn = authMap[u.id] ?? null;
    const status = !lastSignIn
      ? 'INVITED'
      : new Date(lastSignIn).getTime() > sevenDaysAgo
        ? 'ACTIVE'
        : 'INACTIVE';
    return {
      ...u,
      platformId: `STU-${year}-${String(i + 1).padStart(3, '0')}`,
      departmentName: (u.departments as any)?.name ?? null,
      className: (u.classes as any)?.name ?? null,
      classYear: (u.classes as any)?.year ?? null,
      status,
      dateEnrolled: new Date(u.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    };
  });
}

// ─── Enrollment stats (scoped to admin's college) ─────────────────────────────

export async function getEnrollmentStats() {
  const scope = await getCallerScope();
  if (!scope.userId) return { totalStudents: 0 };

  const adminClient = createAdminClient();

  let countQ = adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT');
  if (scope.collegeId) countQ = (countQ as any).eq('college_id', scope.collegeId);
  if (scope.role === 'SUB_ADMIN' && scope.departmentId) {
    countQ = (countQ as any).eq('department_id', scope.departmentId);
  } else if (scope.role === 'MENTOR') {
    if (scope.classIds.length === 0) return { totalStudents: 0 };
    countQ = (countQ as any).in('class_id', scope.classIds);
  }
  const { count: totalStudents } = await countQ;

  return { totalStudents: totalStudents ?? 0 };
}

// ─── Manual enrollment (single student) ───────────────────────────────────────

export async function enrollStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: adminProfile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = adminProfile?.college_id ?? null;

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const sendInvite = formData.get('sendInvite') === 'true';
  const departmentId = (formData.get('department_id') as string) || null;
  const classId = (formData.get('class_id') as string) || null;
  const section = (formData.get('section') as string) || null;
  const registrationId = (formData.get('registration_id') as string) || null;
  const semesterRaw = (formData.get('semester') as string) || '';
  const semester = semesterRaw ? Math.max(1, Math.min(12, parseInt(semesterRaw, 10))) : null;

  if (!name || !email) return { error: 'Name and email are required.' };
  if (semesterRaw && Number.isNaN(parseInt(semesterRaw, 10))) {
    return { error: 'Semester must be a number between 1 and 12.' };
  }

  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) return { error: authError.message };

  const userId = authData.user?.id;
  if (!userId) return { error: 'Could not create user.' };

  const { error: userError } = await adminClient.from('users').upsert({
    id: userId,
    email,
    name,
    role: 'STUDENT',
    college_id: collegeId,
    temp_password: tempPassword,
    department_id: departmentId,
    class_id: classId,
    section,
    registration_id: registrationId,
    semester,
  });

  if (userError) return { error: userError.message };

  let emailSent = false;
  let emailError: string | undefined;

  if (sendInvite) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/login`,
    });
    emailSent = !resetError;
    emailError = resetError?.message;
  }

  revalidatePath('/admin/enrollment');
  return { success: true as const, studentId: userId, tempPassword, emailSent, emailError };
}

// ─── Bulk enrollment (CSV rows) ───────────────────────────────────────────────

export interface BulkRow {
  name: string;
  email: string;
  registration_id?: string;
  department?: string;   // name — resolved to ID on server
  class?: string;        // name — resolved to ID on server
  section?: string;
  semester?: string;     // numeric string 1-12
}

export interface BulkResult extends BulkRow {
  studentId?: string;
  tempPassword?: string;
  status: 'valid' | 'error';
  message?: string;
}

export async function processBulkEnrollment(
  rows: BulkRow[],
): Promise<BulkResult[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let collegeId: string | null = null;
  if (user) {
    const { data: adminProfile } = await supabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single();
    collegeId = adminProfile?.college_id ?? null;
  }

  const adminClient = createAdminClient();
  const results: BulkResult[] = [];

  // Batch-resolve department names → IDs for this college
  const deptNameMap: Record<string, string> = {};
  if (collegeId) {
    const deptNames = [...new Set(rows.map(r => r.department?.trim()).filter(Boolean))] as string[];
    if (deptNames.length > 0) {
      const { data: deptRows } = await adminClient
        .from('departments')
        .select('id, name')
        .eq('college_id', collegeId)
        .in('name', deptNames);
      (deptRows ?? []).forEach((d: any) => { deptNameMap[d.name.toLowerCase()] = d.id; });
    }
  }

  // Batch-resolve class names → IDs for this college
  const classNameMap: Record<string, string> = {};
  if (collegeId) {
    const classNames = [...new Set(rows.map(r => r.class?.trim()).filter(Boolean))] as string[];
    if (classNames.length > 0) {
      const deptIds = Object.values(deptNameMap);
      let classQ = adminClient.from('classes').select('id, name, dept_id, departments!dept_id(college_id)').in('name', classNames);
      const { data: classRows } = await classQ;
      (classRows ?? []).forEach((c: any) => {
        if ((c.departments as any)?.college_id === collegeId) {
          classNameMap[c.name.toLowerCase()] = c.id;
        }
      });
    }
  }

  for (const row of rows) {
    if (!row.name || !row.email || !row.email.includes('@')) {
      results.push({ ...row, status: 'error', message: 'Invalid email or name' });
      continue;
    }

    const semesterRaw = row.semester?.trim() ?? '';
    const semesterNum = semesterRaw ? parseInt(semesterRaw, 10) : null;
    if (semesterRaw && (isNaN(semesterNum!) || semesterNum! < 1 || semesterNum! > 12)) {
      results.push({ ...row, status: 'error', message: 'Semester must be 1–12' });
      continue;
    }

    const departmentId = row.department ? (deptNameMap[row.department.trim().toLowerCase()] ?? null) : null;
    const classId = row.class ? (classNameMap[row.class.trim().toLowerCase()] ?? null) : null;

    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

    try {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: row.email,
        password: tempPassword,
        email_confirm: true,
      });

      if (authError) {
        results.push({ ...row, status: 'error', message: authError.message });
        continue;
      }

      const userId = authData.user?.id;
      if (!userId) {
        results.push({ ...row, status: 'error', message: 'User creation failed' });
        continue;
      }

      await adminClient.from('users').upsert({
        id: userId,
        email: row.email,
        name: row.name,
        role: 'STUDENT',
        college_id: collegeId,
        temp_password: tempPassword,
        registration_id: row.registration_id?.trim() || null,
        department_id: departmentId,
        class_id: classId,
        section: row.section?.trim() || null,
        semester: semesterNum,
      });

      results.push({
        ...row,
        studentId: `AP-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        tempPassword,
        status: 'valid',
      });
    } catch (err: any) {
      results.push({ ...row, status: 'error', message: err?.message ?? 'Unknown error' });
    }
  }

  revalidatePath('/admin/enrollment');
  return results;
}
// ─── Update student profile details ──────────────────────────────────────────

export async function updateStudentDetails(
  studentId: string,
  data: {
    name: string;
    registration_id: string | null;
    department_id: string | null;
    class_id: string | null;
    section: string | null;
    semester: number | null;
  }
) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('users')
    .update({
      name: data.name,
      registration_id: data.registration_id || null,
      department_id: data.department_id || null,
      class_id: data.class_id || null,
      section: data.section || null,
      semester: data.semester || null,
    })
    .eq('id', studentId);

  if (error) return { error: error.message };
  revalidatePath('/admin/enrollment');
  return { success: true as const };
}

// ─── Remove (delete) a student account ────────────────────────────────────────

export async function removeStudent(studentId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();

  const { error: userError } = await adminClient
    .from('users')
    .delete()
    .eq('id', studentId);

  if (userError) return { error: userError.message };

  const { error: authError } = await adminClient.auth.admin.deleteUser(studentId);
  if (authError) return { error: authError.message };

  revalidatePath('/admin/enrollment');
  return { success: true as const };
}

// ─── Reset a student's password (admin action) ────────────────────────────────

export async function resetStudentPassword(studentId: string, sendEmail: boolean = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();
  const newPassword = Math.random().toString(36).slice(-8) + 'A1!';

  // Update auth password
  const { error: authError } = await adminClient.auth.admin.updateUserById(studentId, {
    password: newPassword,
  });
  if (authError) return { error: authError.message };

  // Fetch student email for sending reset link
  const { data: studentRow } = await adminClient
    .from('users')
    .select('email')
    .eq('id', studentId)
    .single();

  // Save new temp password and clear old one
  await adminClient
    .from('users')
    .update({ temp_password: newPassword })
    .eq('id', studentId);

  // Optionally send a reset email via Supabase
  if (sendEmail && studentRow?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    await supabase.auth.resetPasswordForEmail(studentRow.email, {
      redirectTo: `${siteUrl}/reset-password`,
    });
  }

  revalidatePath('/admin/enrollment');
  return { success: true as const, newPassword };
}
