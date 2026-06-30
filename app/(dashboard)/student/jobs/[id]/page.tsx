import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getJobPostingById, getMyApplications } from '@/app/actions/jobs';
import ApplyButton from './ApplyButton';

const JOB_TYPE_STYLE: Record<string, string> = {
  'Full Time':  'bg-primary/10 text-primary border-primary/20',
  'Internship': 'bg-secondary/10 text-secondary border-secondary/20',
  'Contract':   'bg-tertiary/10 text-tertiary border-tertiary/20',
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [job, myApplications] = await Promise.all([
    getJobPostingById(id),
    getMyApplications(),
  ]);
  if (!job) notFound();

  const myApp = myApplications.find(a => a.job_id === id);
  const deadline = job.application_deadline
    ? new Date(job.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link
        href="/student/jobs"
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-6 font-metric-label transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to Jobs
      </Link>

      {/* Header card */}
      <div className="bg-surface-container-lowest border border-secondary/20 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-caption text-secondary text-xs font-semibold mb-0.5">{job.companyName}</p>
            {job.companyIndustry && (
              <p className="font-caption text-on-surface-variant text-xs mb-1">{job.companyIndustry}</p>
            )}
            <h1 className="font-headline-md text-on-surface text-xl font-bold">{job.title}</h1>
          </div>
          {job.job_type && (
            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-caption ${JOB_TYPE_STYLE[job.job_type] ?? 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
              {job.job_type}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-on-surface-variant font-caption mb-4">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">location_on</span>
              {job.location}
            </span>
          )}
          {job.package_ctc && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">payments</span>
              {job.package_ctc}
            </span>
          )}
          {deadline && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">event</span>
              Deadline: {deadline}
            </span>
          )}
          {job.min_aptitude_score != null && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">grade</span>
              Min score: {job.min_aptitude_score}
            </span>
          )}
        </div>

        {job.degree_types && job.degree_types.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(job.degree_types as string[]).map((d) => (
              <span key={d} className="text-xs px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-outline-variant font-caption">
                {d}
              </span>
            ))}
          </div>
        )}

        <ApplyButton jobId={id} studentId={user?.id ?? ''} initialStatus={myApp?.status ?? null} />
      </div>

      {/* Description */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-4">
        <h2 className="font-metric-label text-on-surface font-semibold mb-3">About the Role</h2>
        <p className="font-body-md text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed">{job.description}</p>
      </div>

      {/* Requirements (optional) */}
      {job.requirements && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <h2 className="font-metric-label text-on-surface font-semibold mb-3">Eligibility & Requirements</h2>
          <p className="font-body-md text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
        </div>
      )}
    </div>
  );
}
