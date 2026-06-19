import { getApplicationsForJob, getMyJobPostings } from '@/app/actions/company';
import ApplicationsClient from './ApplicationsClient';

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job: jobId } = await searchParams;
  const [applications, jobs] = await Promise.all([
    getApplicationsForJob(jobId ?? null),
    getMyJobPostings(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display-sm text-on-background text-2xl font-bold mb-1">Applications</h1>
        <p className="font-body-md text-on-surface-variant">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
      </div>
      <ApplicationsClient
        initialApplications={applications}
        jobs={jobs.map(j => ({ id: j.id, title: j.title }))}
        selectedJobId={jobId ?? null}
      />
    </div>
  );
}
