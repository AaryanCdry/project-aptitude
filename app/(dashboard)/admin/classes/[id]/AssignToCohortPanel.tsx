'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { assignClassToCohort } from '@/app/actions/mapping';

interface Cohort { id: string; name: string; }

interface Props {
  classId: string;
  cohorts: Cohort[];
}

export default function AssignToCohortPanel({ classId, cohorts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [feedback, setFeedback] = useState<{ added: number } | { error: string } | null>(null);

  function handleAssign() {
    if (!selectedCohortId) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await assignClassToCohort(classId, selectedCohortId);
      if ('error' in res) {
        setFeedback({ error: res.error ?? 'Unknown error' });
      } else {
        setFeedback({ added: res.added });
        router.refresh();
      }
    });
  }

  if (cohorts.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 mb-8 shadow-sm flex items-center gap-3">
        <span className="material-symbols-outlined text-outline">info</span>
        <p className="font-body-md text-on-surface-variant">
          No cohorts available.{' '}
          <a href="/admin/cohorts" className="text-primary underline underline-offset-2">Create a cohort</a> first, then assign students here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 mb-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <p className="font-metric-label text-on-surface mb-1">Assign All Students to a Cohort</p>
          <p className="font-caption text-on-surface-variant mb-3">
            Enroll every student in this class into the selected cohort. Existing members are not duplicated.
          </p>
          <div className="relative max-w-sm">
            <select
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
            >
              <option value="">Select cohort…</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {feedback && 'added' in feedback && (
            <span className="font-caption text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {feedback.added === 0 ? 'Already up to date' : `${feedback.added} students added`}
            </span>
          )}
          {feedback && 'error' in feedback && (
            <span className="font-caption text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {feedback.error}
            </span>
          )}
          <button
            onClick={handleAssign}
            disabled={!selectedCohortId || isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">group_add</span>
            {isPending ? 'Assigning…' : 'Assign All'}
          </button>
        </div>
      </div>
    </div>
  );
}
