import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getStudentDegreeJobs } from '@/app/actions/jobs';
import { DEGREE_JOB_MAPPINGS } from '@/lib/jobs/degreeJobMappings';
import JobsClient from './JobsClient';

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { jobs: initialJobs, courseType } = await getStudentDegreeJobs();

  return (
    <div className="p-6 max-w-container-max-width mx-auto">
      <div className="mb-6">
        <h1 className="font-headline-md text-2xl text-on-surface">Job Opportunities</h1>
        <p className="font-body-md text-on-surface-variant mt-1">
          Discover jobs relevant to your degree. All listings redirect to the original application page.
        </p>
      </div>
      <JobsClient
        initialJobs={initialJobs}
        studentDegree={courseType}
        isConfigured={!!process.env.RAPIDAPI_KEY}
        allDegrees={Object.entries(DEGREE_JOB_MAPPINGS).map(([key, v]) => ({ value: key, label: v.label }))}
      />
    </div>
  );
}
