'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCompanyProvisioningMode } from '@/lib/auth/signup';
import { revalidatePath } from 'next/cache';

async function getCompanyUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  // Role is read from the server-controlled users table, not client-writable user_metadata
  const adminClient = createAdminClient();
  const { data: userRow } = await adminClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (userRow?.role !== 'COMPANY') throw new Error('Not authorized');
  return { userId: user.id };
}

export async function completeCompanySignup(input: {
  companyName: string;
  email: string;
  industry: string | null;
  website: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const adminClient = createAdminClient();

  // Idempotent: skip if row already exists (handles double-submit)
  const { data: existing } = await adminClient
    .from('users').select('id, role').eq('id', user.id).single();
  const provisioningMode = getCompanyProvisioningMode(existing?.role);
  if (provisioningMode === 'reject') {
    return { error: 'This email is already registered with a non-company account.' };
  }

  if (provisioningMode === 'create') {
    // Role is hardcoded here — not user-supplied
    const { error: userErr } = await adminClient.from('users').insert({
      id: user.id,
      name: input.companyName,
      email: input.email,
      role: 'COMPANY',
    });
    if (userErr) return { error: userErr.message };
  }

  const { error: profileErr } = await adminClient.from('company_profiles').upsert(
    {
      id: user.id,
      company_name: input.companyName,
      industry: input.industry,
      website: input.website,
    },
    { onConflict: 'id' },
  );
  if (profileErr) {
    if (provisioningMode === 'create') {
      await adminClient.from('users').delete().eq('id', user.id);
    }
    return { error: profileErr.message };
  }

  return { success: true as const };
}

export async function getCompanyProfile() {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('company_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function updateCompanyProfile(data: {
  company_name?: string;
  industry?: string;
  website?: string;
  description?: string;
}) {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('company_profiles')
    .update(data)
    .eq('id', userId);
  if (error) return { error: error.message };
  revalidatePath('/company/profile');
  return { success: true as const };
}

export async function createJobPosting(data: {
  title: string;
  description: string;
  requirements?: string;
  degree_types?: string[];
  min_aptitude_score?: number | null;
  package_ctc?: string;
  location?: string;
  job_type?: string;
  application_deadline?: string;
}) {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();
  const { error } = await adminClient.from('job_postings').insert({
    company_id: userId,
    title: data.title,
    description: data.description,
    requirements: data.requirements ?? null,
    degree_types: data.degree_types ?? null,
    min_aptitude_score: data.min_aptitude_score ?? null,
    package_ctc: data.package_ctc ?? null,
    location: data.location ?? null,
    job_type: data.job_type ?? 'Full Time',
    application_deadline: data.application_deadline ?? null,
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath('/company/jobs');
  return { success: true as const };
}

export async function updateJobPosting(id: string, data: {
  title?: string;
  description?: string;
  requirements?: string;
  degree_types?: string[];
  min_aptitude_score?: number | null;
  package_ctc?: string;
  location?: string;
  job_type?: string;
  application_deadline?: string;
}) {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('job_postings')
    .update(data)
    .eq('id', id)
    .eq('company_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/company/jobs');
  return { success: true as const };
}

export async function toggleJobActive(id: string) {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();
  const { data: job } = await adminClient
    .from('job_postings')
    .select('is_active')
    .eq('id', id)
    .eq('company_id', userId)
    .single();
  if (!job) return { error: 'Job not found' };
  const { error } = await adminClient
    .from('job_postings')
    .update({ is_active: !job.is_active })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/company/jobs');
  return { success: true as const, is_active: !job.is_active };
}

export async function deleteJobPosting(id: string) {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('job_postings')
    .delete()
    .eq('id', id)
    .eq('company_id', userId);
  if (error) return { error: error.message };
  revalidatePath('/company/jobs');
  return { success: true as const };
}

export async function getMyJobPostings() {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('job_postings')
    .select('*, job_applications(count)')
    .eq('company_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(j => ({
    ...j,
    applicationCount: (j.job_applications as any)?.[0]?.count ?? 0,
  }));
}

export async function getMyApplicationStats() {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();

  const { data: postings } = await adminClient
    .from('job_postings')
    .select('id')
    .eq('company_id', userId);

  const jobIds = (postings ?? []).map(p => p.id);
  if (jobIds.length === 0) return { totalPostings: 0, totalApplications: 0, shortlisted: 0, recentApplications: [] };

  const { data: apps } = await adminClient
    .from('job_applications')
    .select('*, job_postings(title)')
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false });

  const allApps = apps ?? [];
  return {
    totalPostings: (postings ?? []).length,
    totalApplications: allApps.length,
    shortlisted: allApps.filter(a => a.status === 'shortlisted').length,
    recentApplications: allApps.slice(0, 5).map(a => ({
      id: a.id,
      status: a.status,
      applied_at: a.applied_at,
      jobTitle: (a.job_postings as any)?.title ?? '',
      studentName: (a.student_snapshot as any)?.name ?? 'Unknown',
    })),
  };
}

export async function getApplicationsForJob(jobId: string | null) {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();

  let query = adminClient
    .from('job_applications')
    .select('*, job_postings!inner(title, company_id)')
    .eq('job_postings.company_id', userId)
    .order('applied_at', { ascending: false });

  if (jobId) query = query.eq('job_id', jobId);

  const { data } = await query;
  return data ?? [];
}

export async function updateApplicationStatus(appId: string, status: 'applied' | 'shortlisted' | 'rejected') {
  const { userId } = await getCompanyUser();
  const adminClient = createAdminClient();
  // verify the application belongs to one of this company's jobs
  const { data: app } = await adminClient
    .from('job_applications')
    .select('job_postings!inner(company_id)')
    .eq('id', appId)
    .single();
  if ((app?.job_postings as any)?.company_id !== userId) return { error: 'Not authorized' };

  const { error } = await adminClient
    .from('job_applications')
    .update({ status })
    .eq('id', appId);
  if (error) return { error: error.message };
  revalidatePath('/company/applications');
  return { success: true as const };
}
