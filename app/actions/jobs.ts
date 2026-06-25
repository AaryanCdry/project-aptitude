'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCallerScope } from './scope';
import { revalidatePath } from 'next/cache';
import { searchJobs } from '@/lib/jobs/jobService';
import { buildSearchQuery } from '@/lib/jobs/degreeJobMappings';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Job, JobSearchParams } from '@/lib/jobs/providers/base';

export async function searchJobsAction(params: JobSearchParams): Promise<Job[]> {
  const scope = await getCallerScope();
  if (!scope.userId) return [];

  const allowed = await checkRateLimit(scope.userId, 'jobs_search', 5, 60);
  if (!allowed) throw new Error('Rate limit exceeded. Please wait a moment before searching again.');

  return searchJobs(params);
}

export async function getGeneralJobs(): Promise<{ jobs: Job[] }> {
  const jobs = await searchJobs({ query: 'software developer', location: 'India', page: 1 });
  return { jobs: jobs.slice(0, 6) };
}

export async function getStudentDegreeJobs(): Promise<{ jobs: Job[]; courseType: string | null }> {
  const scope = await getCallerScope();
  const targetId = scope.userId;
  if (!targetId) return { jobs: [], courseType: null };

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('users')
    .select('class_id, classes!class_id(departments!dept_id(course_type))')
    .eq('id', targetId)
    .single();

  const courseType: string | null = (data as any)?.classes?.departments?.course_type ?? null;
  if (!courseType) return { jobs: [], courseType: null };

  const query = buildSearchQuery(courseType);
  const jobs = await searchJobs({ query, location: 'India', page: 1 });

  return { jobs: jobs.slice(0, 6), courseType };
}

export async function getPartnerJobPostings() {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('job_postings')
    .select('*, company_profiles!company_id(company_name, industry, website)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return (data ?? []).map(j => ({
    ...j,
    companyName: (j.company_profiles as any)?.company_name ?? 'Unknown Company',
    companyIndustry: (j.company_profiles as any)?.industry ?? null,
  }));
}

export async function applyToPartnerJob(jobId: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return { error: 'Not authenticated' };
  if (scope.role !== 'STUDENT') return { error: 'Only students can apply' };

  const adminClient = createAdminClient();

  // Check if already applied
  const { data: existing, error: existingError } = await adminClient
    .from('job_applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('student_id', scope.userId)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (existing) return { error: 'Already applied' };

  // Build student snapshot
  const { data: student } = await adminClient
    .from('users')
    .select('name, email, class_id, classes!class_id(name, year, section, departments!dept_id(name, course_type), batches!batch_id(name))')
    .eq('id', scope.userId)
    .single();

  const { data: scores } = await adminClient
    .from('scores')
    .select('domain, score')
    .eq('user_id', scope.userId);

  const avgScore = scores && scores.length > 0
    ? Math.round(scores.reduce((s, r) => s + r.score, 0) / scores.length)
    : null;

  const snapshot = {
    name: (student as any)?.name,
    email: (student as any)?.email,
    className: (student as any)?.classes?.name,
    year: (student as any)?.classes?.year,
    section: (student as any)?.classes?.section,
    department: (student as any)?.classes?.departments?.name,
    courseType: (student as any)?.classes?.departments?.course_type,
    batch: (student as any)?.classes?.batches?.name,
    avgScore,
    scores: scores ?? [],
  };

  const { error } = await adminClient.from('job_applications').insert({
    job_id: jobId,
    student_id: scope.userId,
    status: 'applied',
    student_snapshot: snapshot,
  });
  if (error) return { error: error.message };

  revalidatePath('/student/jobs');
  return { success: true as const };
}

export async function getJobPostingById(id: string) {
  const scope = await getCallerScope();
  if (!scope.userId) return null;

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('job_postings')
    .select('*, company_profiles!company_id(company_name, industry, website)')
    .eq('id', id)
    .eq('is_active', true)
    .single();
  if (!data) return null;

  return {
    ...data,
    companyName: (data.company_profiles as any)?.company_name ?? 'Unknown Company',
    companyIndustry: (data.company_profiles as any)?.industry ?? null,
    companyWebsite: (data.company_profiles as any)?.website ?? null,
  };
}

export async function getMyApplications() {
  const scope = await getCallerScope();
  if (!scope.userId) return [];

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('job_applications')
    .select('id, job_id, status, applied_at, job_postings!job_id(title, company_profiles!company_id(company_name))')
    .eq('student_id', scope.userId)
    .order('applied_at', { ascending: false });

  return (data ?? []).map(a => ({
    id: a.id,
    job_id: a.job_id,
    status: a.status,
    applied_at: a.applied_at,
    jobTitle: (a.job_postings as any)?.title ?? '',
    companyName: (a.job_postings as any)?.company_profiles?.company_name ?? '',
  }));
}
