'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCallerScope } from './scope';
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
