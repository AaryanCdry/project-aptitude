'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Fetch all enrolled students ────────────────────────────────────────────

export async function getEnrolledStudents(filter?: 'ACTIVE' | 'INVITED') {
  const supabase = await createClient();

  let query = supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('role', 'STUDENT')
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  // Build a student ID like STU-2024-XXX from the row index + created year
  return (data ?? []).map((u: any, i: number) => {
    const year = new Date(u.created_at).getFullYear();
    return {
      ...u,
      studentId: `STU-${year}-${String(i + 1).padStart(3, '0')}`,
      status: 'ACTIVE', // default — we don't have a pending state in schema yet
      dateEnrolled: new Date(u.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    };
  });
}

// ─── Enrollment stats ─────────────────────────────────────────────────────────

export async function getEnrollmentStats() {
  const supabase = await createClient();

  const { count: totalStudents } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'STUDENT');

  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    totalStudents: totalStudents ?? 0,
    pendingInvites: 0, // placeholder — would need an invitations table
    cohorts: cohorts ?? [],
  };
}

// ─── Manual enrollment (single student) ───────────────────────────────────────

export async function enrollStudent(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const cohortId = formData.get('cohortId') as string | null;

  if (!name || !email) {
    return { error: 'Name and email are required.' };
  }

  // Create a Supabase auth user with a temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) {
    console.error('Auth error:', authError);
    return { error: authError.message };
  }

  const userId = authData.user?.id;
  if (!userId) return { error: 'Could not create user.' };

  // Upsert into users table
  const { error: userError } = await supabase.from('users').upsert({
    id: userId,
    email,
    name,
    role: 'STUDENT',
  });

  if (userError) {
    console.error('User record error:', userError);
    return { error: userError.message };
  }

  // Optionally add to cohort
  if (cohortId) {
    await supabase.from('cohort_members').insert({ cohort_id: cohortId, student_id: userId });
  }

  revalidatePath('/admin/enrollment');
  return { success: true, studentId: userId, tempPassword };
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
  const results: BulkResult[] = [];

  for (const row of rows) {
    if (!row.name || !row.email || !row.email.includes('@')) {
      results.push({ ...row, status: 'error', message: 'Invalid email or name' });
      continue;
    }

    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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

      await supabase.from('users').upsert({ id: userId, email: row.email, name: row.name, role: 'STUDENT' });

      if (cohortId) {
        await supabase.from('cohort_members').insert({ cohort_id: cohortId, student_id: userId });
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
