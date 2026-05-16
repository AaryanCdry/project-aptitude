'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// ─── Fetch all enrolled students (scoped to admin's college) ────────────────

export async function getEnrolledStudents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: adminProfile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = adminProfile?.college_id ?? null;

  let query = supabase
    .from('users')
    .select(`
      id, name, email, role, created_at, temp_password,
      registration_id, section,
      departments!department_id(name),
      classes!class_id(name)
    `)
    .eq('role', 'STUDENT')
    .order('created_at', { ascending: false });
  if (collegeId) query = (query as any).eq('college_id', collegeId);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching students:', error.message ?? JSON.stringify(error));
    return [];
  }

  return (data ?? []).map((u: any, i: number) => {
    const year = new Date(u.created_at).getFullYear();
    return {
      ...u,
      platformId: `STU-${year}-${String(i + 1).padStart(3, '0')}`,
      departmentName: (u.departments as any)?.name ?? null,
      className: (u.classes as any)?.name ?? null,
      status: 'ACTIVE',
      dateEnrolled: new Date(u.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    };
  });
}

// ─── Enrollment stats (scoped to admin's college) ─────────────────────────────

export async function getEnrollmentStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { totalStudents: 0, pendingInvites: 0, cohorts: [] };

  const { data: adminProfile } = await supabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single();
  const collegeId = adminProfile?.college_id ?? null;

  let countQ = supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT');
  if (collegeId) countQ = (countQ as any).eq('college_id', collegeId);
  const { count: totalStudents } = await countQ;

  let cohortsQ = supabase
    .from('cohorts')
    .select('id, name')
    .order('created_at', { ascending: false });
  if (collegeId) cohortsQ = (cohortsQ as any).eq('college_id', collegeId);
  const { data: cohorts } = await cohortsQ;

  return {
    totalStudents: totalStudents ?? 0,
    pendingInvites: 0,
    cohorts: cohorts ?? [],
  };
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
  const cohortId = formData.get('cohortId') as string | null;
  const sendInvite = formData.get('sendInvite') === 'true';
  const departmentId = (formData.get('department_id') as string) || null;
  const classId = (formData.get('class_id') as string) || null;
  const section = (formData.get('section') as string) || null;
  const registrationId = (formData.get('registration_id') as string) || null;

  if (!name || !email) return { error: 'Name and email are required.' };

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
  });

  if (userError) return { error: userError.message };

  let cohortName: string | undefined;
  if (cohortId) {
    await adminClient.from('cohort_members').insert({ cohort_id: cohortId, student_id: userId });
    const { data: cohortRow } = await adminClient
      .from('cohorts').select('name').eq('id', cohortId).single();
    cohortName = cohortRow?.name;
  }

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
}

export interface BulkResult {
  name: string;
  email: string;
  studentId?: string;
  tempPassword?: string;
  status: 'valid' | 'error';
  message?: string;
}

export async function processBulkEnrollment(
  rows: BulkRow[],
  cohortId?: string
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

  for (const row of rows) {
    if (!row.name || !row.email || !row.email.includes('@')) {
      results.push({ ...row, status: 'error', message: 'Invalid email or name' });
      continue;
    }

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
      });

      if (cohortId) {
        await adminClient.from('cohort_members').insert({ cohort_id: cohortId, student_id: userId });
      }

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
      redirectTo: `${siteUrl}/login`,
    });
  }

  revalidatePath('/admin/enrollment');
  return { success: true as const, newPassword };
}
