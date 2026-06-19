import Link from 'next/link';
import { getMyJobPostings } from '@/app/actions/company';
import JobsClient from './JobsClient';

export default async function CompanyJobsPage() {
  const jobs = await getMyJobPostings();
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display-sm text-on-background text-2xl font-bold mb-1">Posted Jobs</h1>
          <p className="font-body-md text-on-surface-variant">{jobs.length} posting{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/company/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Post New Job
        </Link>
      </div>
      <JobsClient initialJobs={jobs} />
    </div>
  );
}
