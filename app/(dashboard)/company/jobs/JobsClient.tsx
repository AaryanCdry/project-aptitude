'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleJobActive, deleteJobPosting } from '@/app/actions/company';

type Job = {
  id: string;
  title: string;
  job_type: string;
  location: string | null;
  package_ctc: string | null;
  application_deadline: string | null;
  is_active: boolean;
  created_at: string;
  applicationCount: number;
};

const JOB_TYPE_STYLE: Record<string, string> = {
  'Full Time': 'bg-primary/10 text-primary',
  'Internship': 'bg-secondary/10 text-secondary',
  'Contract': 'bg-tertiary/10 text-tertiary',
};

export default function JobsClient({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleJobActive(id);
      if ('success' in res) {
        setJobs(js => js.map(j => j.id === id ? { ...j, is_active: res.is_active as boolean } : j));
      }
    });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteJobPosting(id);
      if ('success' in res) setJobs(js => js.filter(j => j.id !== id));
    });
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-outline block mb-3">work_off</span>
        <h2 className="font-headline-md text-on-surface mb-1">No jobs posted yet</h2>
        <p className="font-body-md text-on-surface-variant text-sm mb-4">Post your first opening to start receiving applications.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
      <div className="divide-y divide-outline-variant">
        {jobs.map(job => (
          <div key={job.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-surface-container-low/40 transition-colors ${!job.is_active ? 'opacity-60' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="font-metric-label text-on-surface font-semibold text-sm">{job.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-metric-label ${JOB_TYPE_STYLE[job.job_type] ?? 'bg-surface-container text-on-surface'}`}>
                  {job.job_type}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {job.location && (
                  <span className="font-caption text-on-surface-variant text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    {job.location}
                  </span>
                )}
                {job.package_ctc && (
                  <span className="font-caption text-on-surface-variant text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">payments</span>
                    {job.package_ctc}
                  </span>
                )}
                {job.application_deadline && (
                  <span className="font-caption text-on-surface-variant text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">event</span>
                    Deadline: {new Date(job.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="font-caption text-on-surface-variant text-xs mr-2">
                {job.applicationCount} applied
              </span>

              <button
                onClick={() => handleToggle(job.id)}
                disabled={isPending}
                title={job.is_active ? 'Deactivate' : 'Activate'}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${job.is_active ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${job.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>

              <button
                onClick={() => handleDelete(job.id, job.title)}
                disabled={isPending}
                className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors disabled:opacity-50 ml-1"
                title="Delete"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
