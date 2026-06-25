'use client';

import { useState, useTransition } from 'react';
import { applyToPartnerJob } from '@/app/actions/jobs';

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

export default function ApplyButton({
  jobId,
  initialStatus,
}: {
  jobId: string;
  initialStatus: string | null;
}) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [isPending, startTransition] = useTransition();

  function handleApply() {
    startTransition(async () => {
      const res = await applyToPartnerJob(jobId);
      if ('success' in res) setStatus('applied');
    });
  }

  if (status) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-metric-label border ${STATUS_STYLE[status] ?? ''}`}>
        {STATUS_LABEL[status] ?? status}
      </span>
    );
  }

  return (
    <button
      onClick={handleApply}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-metric-label text-sm hover:bg-secondary/90 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Applying…</>
      ) : (
        <><span className="material-symbols-outlined text-sm">send</span>Apply Now</>
      )}
    </button>
  );
}
