'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function getCollegeWithAdmins(collegeId: string) {
  const adminClient = createAdminClient();

  const { data: college, error } = await adminClient
    .from('colleges')
    .select('id, name, code, status, created_at')
    .eq('id', collegeId)
    .single();

  if (error || !college) return null;

  const { data: admins } = await adminClient
    .from('users')
    .select('id, name, email, created_at, temp_password')
    .eq('college_id', collegeId)
    .eq('role', 'ADMIN')
    .order('created_at', { ascending: false });

  return { ...college, admins: admins ?? [] };
}

export async function createCollegeAdmin(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const collegeId = formData.get('collegeId') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!collegeId || !name || !email) return { error: 'All fields are required.' };

  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
  const adminClient = createAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: 'ADMIN' },
  });

  if (authError) return { error: authError.message };

  const userId = authData.user?.id;
  if (!userId) return { error: 'Could not create user.' };

  const { error: userError } = await adminClient.from('users').upsert({
    id: userId,
    email,
    name,
    role: 'ADMIN',
    college_id: collegeId,
    temp_password: tempPassword,
  });

  if (userError) return { error: userError.message };

  revalidatePath(`/super/colleges/${collegeId}`);
  return { success: true as const, tempPassword };
}

export async function removeCollegeAdmin(adminId: string, collegeId: string) {
  const adminClient = createAdminClient();

  await adminClient.from('users').update({ college_id: null, role: 'STUDENT' }).eq('id', adminId);

  revalidatePath(`/super/colleges/${collegeId}`);
  return { success: true };
}

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'SUPER_ADMIN') return null;
  return user;
}

export async function generateRegistrationCode() {
  const user = await requireSuperAdmin();
  if (!user) return { error: 'Forbidden' };

  // 10 random bytes → 20 hex chars → 80 bits of entropy
  const code = crypto.randomBytes(10).toString('hex').toUpperCase();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('college_registration_codes')
    .insert({ code });

  if (error) return { error: error.message };

  revalidatePath('/super/codes');
  return { success: true as const, code };
}

export async function listRegistrationCodes() {
  const user = await requireSuperAdmin();
  if (!user) return [];

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('college_registration_codes')
    .select('id, code, is_used, used_by_college_id, created_at, used_at')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function revokeRegistrationCode(id: string) {
  const user = await requireSuperAdmin();
  if (!user) return { error: 'Forbidden' };

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from('college_registration_codes')
    .select('is_used')
    .eq('id', id)
    .single();

  if (!existing) return { error: 'Code not found.' };
  if (existing.is_used) return { error: 'Cannot revoke an already-used code.' };

  const { error } = await adminClient
    .from('college_registration_codes')
    .delete()
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/super/codes');
  return { success: true as const };
}
