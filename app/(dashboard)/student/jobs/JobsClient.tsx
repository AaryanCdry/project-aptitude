'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import Link from 'next/link';
import { searchJobsAction, applyToPartnerJob } from '@/app/actions/jobs';
import { buildSearchQuery } from '@/lib/jobs/degreeJobMappings';
import type { Job } from '@/lib/jobs/providers/base';

interface DegreeOption { value: string; label: string }

type PartnerJob = {
  id: string;
  title: string;
  job_type: string | null;
  location: string | null;
  package_ctc: string | null;
  application_deadline: string | null;
  degree_types: string[] | null;
  min_aptitude_score: number | null;
  description: string;
  companyName: string;
  companyIndustry: string | null;
};

type MyApplication = {
  id: string;
  job_id: string;
  status: string;
  applied_at: string;
  jobTitle: string;
  companyName: string;
};

interface Props {
  initialJobs: Job[];
  studentDegree: string | null;
  isConfigured: boolean;
  allDegrees: DegreeOption[];
  partnerJobs?: PartnerJob[];
  myApplications?: MyApplication[];
}

const JOB_TYPE_STYLE: Record<string, string> = {
  'Full Time':  'bg-primary/10 text-primary border-primary/20',
  'Internship': 'bg-secondary/10 text-secondary border-secondary/20',
  'Contract':   'bg-tertiary/10 text-tertiary border-tertiary/20',
};

const STATUS_LABEL: Record<string, string> = {
  applied:     'Applied',
  shortlisted: 'Shortlisted ✓',
  rejected:    'Not Selected',
};

const STATUS_STYLE: Record<string, string> = {
  applied:     'bg-primary/10 text-primary border-primary/20',
  shortlisted: 'bg-secondary/10 text-secondary border-secondary/20',
  rejected:    'bg-error/10 text-error border-error/20',
};

function PartnerJobCard({
  job,
  status,
  onApply,
  applyPending,
}: {
  job: PartnerJob;
  status: string | null;
  onApply: (jobId: string) => void;
  applyPending: boolean;
}) {
  const deadline = job.application_deadline
    ? new Date(job.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-secondary/40 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-caption text-secondary text-xs font-semibold truncate">{job.companyName}</p>
          <h3 className="font-metric-label text-on-surface font-semibold mt-0.5 leading-snug">{job.title}</h3>
        </div>
        {job.job_type && (
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-caption ${JOB_TYPE_STYLE[job.job_type] ?? 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
            {job.job_type}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant font-caption">
        {job.location && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {job.location}
          </span>
        )}
        {job.package_ctc && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">payments</span>
            {job.package_ctc}
          </span>
        )}
        {deadline && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">event</span>
            Due {deadline}
          </span>
        )}
      </div>

      {job.degree_types && job.degree_types.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.degree_types.map(d => (
            <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-outline-variant font-caption">
              {d}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-2 flex-wrap">
        <Link
          href={`/student/jobs/${job.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label text-sm hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          View Details
        </Link>

        {status ? (
          <span className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-metric-label border ${STATUS_STYLE[status] ?? ''}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        ) : (
          <button
            onClick={() => onApply(job.id)}
            disabled={applyPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-metric-label text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50"
          >
            {applyPending ? (
              <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Applying…</>
            ) : (
              <><span className="material-symbols-outlined text-sm">send</span>Apply</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  const posted = job.postedAt
    ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.round((new Date(job.postedAt).getTime() - Date.now()) / 86400000),
        'day',
      )
    : null;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-metric-label text-on-surface font-semibold truncate">{job.title}</h3>
          <p className="font-body-md text-on-surface-variant text-sm mt-0.5">{job.company}</p>
        </div>
        <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-caption">
          {job.source}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-on-surface-variant font-caption">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">location_on</span>
          {job.location}
        </span>
        {posted && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {posted}
          </span>
        )}
      </div>

      <a
        href={job.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 transition-colors"
      >
        Apply Now
        <span className="material-symbols-outlined text-sm">open_in_new</span>
      </a>
    </div>
  );
}

export default function JobsClient({
  initialJobs,
  studentDegree,
  isConfigured,
  allDegrees,
  partnerJobs = [],
  myApplications = [],
}: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [query, setQuery] = useState('');
  const [degree, setDegree] = useState(studentDegree ?? '');
  const [location, setLocation] = useState('India');
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Map of job_id → status for applied jobs (optimistic updates included)
  const [appliedMap, setAppliedMap] = useState<Map<string, string>>(
    () => new Map(myApplications.map(a => [a.job_id, a.status])),
  );
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const fetchJobs = useCallback((q: string, deg: string, loc: string, pg: number) => {
    const searchQuery = q.trim() || buildSearchQuery(deg) || 'fresher jobs India';
    setRateLimitError(null);
    startTransition(async () => {
      try {
        const results = await searchJobsAction({ query: searchQuery, location: loc || undefined, page: pg });
        setJobs(results);
      } catch (err: any) {
        if (err?.message?.includes('Rate limit')) {
          setRateLimitError('Too many searches. Please wait a moment before trying again.');
        }
      }
    });
  }, []);

  function handleQueryChange(val: string) {
    setQuery(val);
    setPage(1);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => fetchJobs(val, degree, location, 1), 300);
  }

  function handleDegreeChange(val: string) {
    setDegree(val);
    setPage(1);
    fetchJobs(query, val, location, 1);
  }

  function handleLocationChange(val: string) {
    setLocation(val);
    setPage(1);
    fetchJobs(query, degree, val, 1);
  }

  function handlePageChange(next: number) {
    setPage(next);
    fetchJobs(query, degree, location, next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleApply(jobId: string) {
    setApplyingId(jobId);
    try {
      const res = await applyToPartnerJob(jobId);
      if ('success' in res) {
        setAppliedMap(prev => new Map(prev).set(jobId, 'applied'));
      }
    } finally {
      setApplyingId(null);
    }
  }

  if (!isConfigured && partnerJobs.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-outline block mb-3">work_off</span>
        <h2 className="font-headline-md text-on-surface mb-1">Job search is not configured yet</h2>
        <p className="font-body-md text-on-surface-variant text-sm">Ask your administrator to set up the job provider API key.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* AptiLead Partners section */}
      {partnerJobs.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-secondary">verified</span>
            <h2 className="font-headline-md text-on-surface font-bold">AptiLead Partners</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-metric-label">
              {partnerJobs.length} opening{partnerJobs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerJobs.map(job => (
              <PartnerJobCard
                key={job.id}
                job={job}
                status={appliedMap.get(job.id) ?? null}
                onApply={handleApply}
                applyPending={applyingId === job.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* External jobs section */}
      {isConfigured && (
        <>
          {partnerJobs.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="font-caption text-on-surface-variant text-xs">More opportunities</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
          )}

          {/* Filters */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                placeholder="Search job titles, skills…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <select
              value={degree}
              onChange={e => handleDegreeChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary text-sm"
            >
              <option value="">All degrees</option>
              {allDegrees.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">location_on</span>
              <input
                type="text"
                value={location}
                onChange={e => handleLocationChange(e.target.value)}
                placeholder="Location"
                className="pl-9 pr-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary text-sm w-36"
              />
            </div>
          </div>

          {/* Rate limit error */}
          {rateLimitError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-body-md border border-error/20">
              <span className="material-symbols-outlined text-base shrink-0">timer_off</span>
              {rateLimitError}
            </div>
          )}

          {/* Results */}
          {isPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-surface-container-high rounded w-3/4 mb-2" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2 mb-4" />
                  <div className="h-3 bg-surface-container-high rounded w-1/3 mb-4" />
                  <div className="h-8 bg-surface-container-high rounded" />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-outline block mb-3">search_off</span>
              <h2 className="font-headline-md text-on-surface mb-1">No jobs found</h2>
              <p className="font-body-md text-on-surface-variant text-sm">Try a different search term, degree filter, or location.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map(job => <JobCard key={job.id} job={job} />)}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                  Previous
                </button>
                <span className="font-metric-label text-on-surface-variant text-sm">Page {page}</span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={jobs.length < 10}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
