'use server';

import { createAdminClient } from '@/lib/supabase/admin';

type CollegeSignupInput = {
  collegeName: string;
  collegeCode: string;
  adminName: string;
  email: string;
  password: string;
  registrationCode: string;
};

export async function completeCollegeSignup(input: CollegeSignupInput) {
  const adminClient = createAdminClient();

  // 1. Validate the registration code (reusable — any college can use it)
  const { data: codeRow, error: codeError } = await adminClient
    .from('college_registration_codes')
    .select('id')
    .eq('code', input.registrationCode.trim().toUpperCase())
    .single();

  if (codeError || !codeRow) {
    return { error: 'Invalid registration code.' };
  }

  // 2. Create the college record
  const { data: college, error: collegeError } = await adminClient
    .from('colleges')
    .insert({ name: input.collegeName.trim(), code: input.collegeCode.trim().toUpperCase(), status: 'ACTIVE' })
    .select('id')
    .single();

  if (collegeError || !college) {
    if (collegeError?.code === '23505') {
      return { error: 'A college with that short code already exists. Please choose a different one.' };
    }
    return { error: collegeError?.message ?? 'Failed to create college.' };
  }

  // 3. Create the Supabase auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
    user_metadata: { name: input.adminName, role: 'ADMIN' },
  });

  if (authError || !authData.user) {
    // Roll back the college row
    await adminClient.from('colleges').delete().eq('id', college.id);
    return { error: authError?.message ?? 'Failed to create account.' };
  }

  // 4. Insert the user profile
  const { error: userError } = await adminClient.from('users').insert({
    id: authData.user.id,
    name: input.adminName.trim(),
    email: input.email.trim().toLowerCase(),
    role: 'ADMIN',
    college_id: college.id,
  });

  if (userError) {
    // Roll back auth user and college
    await adminClient.auth.admin.deleteUser(authData.user.id);
    await adminClient.from('colleges').delete().eq('id', college.id);
    return { error: userError.message };
  }

  return { success: true as const };
}
