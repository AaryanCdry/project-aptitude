'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getCallerScope } from './scope';
import { searchJobs } from '@/lib/jobs/jobService';
import { buildSearchQuery } from '@/lib/jobs/degreeJobMappings';
import type { Job, JobSearchParams } from '@/lib/jobs/providers/base';

export async function searchJobsAction(params: JobSearchParams): Promise<Job[]> {
  const scope = await getCallerScope();
  if (!scope.userId) return [];
  return searchJobs(params);
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
