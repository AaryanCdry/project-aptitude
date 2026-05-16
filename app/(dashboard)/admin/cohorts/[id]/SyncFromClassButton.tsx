'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { syncCohortMembers } from '@/app/actions/mapping';

interface Props {
  cohortId: string;
  linkedClassName?: string | null;
  linkedDeptName?: string | null;
}

export default function SyncFromClassButton({ cohortId, linkedClassName, linkedDeptName }: Props) {
  const label = linkedClassName ?? linkedDeptName;
  if (!label) return null;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ added: number } | { error: string } | null>(null);

  function handleSync() {
    setFeedback(null);
    startTransition(async () => {
      const res = await syncCohortMembers(cohortId);
      if ('error' in res) {
        setFeedback({ error: res.error ?? 'Unknown error' });
      } else {
        setFeedback({ added: res.added });
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-9 h-9 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-tertiary text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>sync</span>
        </div>
        <div>
          <p className="font-metric-label text-on-surface">Auto-sync from {linkedClassName ? 'Class' : 'Department'}</p>
          <p className="font-caption text-on-surface-variant">
            Pull all students from <span className="font-semibold text-on-surface">{label}</span> into this cohort.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {feedback && 'added' in feedback && (
          <span className="font-caption text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            {feedback.added === 0 ? 'All students already synced' : `${feedback.added} students added`}
          </span>
        )}
        {feedback && 'error' in feedback && (
          <span className="font-caption text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {feedback.error}
          </span>
        )}
        <button
          onClick={handleSync}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-tertiary text-on-tertiary rounded-lg font-metric-label text-sm hover:bg-tertiary/90 transition-colors disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[18px] ${isPending ? 'animate-spin' : ''}`}>sync</span>
          {isPending ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
}
