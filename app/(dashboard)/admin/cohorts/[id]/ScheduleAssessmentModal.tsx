'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { scheduleCohortAssessment } from '@/app/actions/cohorts';

const DOMAINS = [
  { value: '', label: 'Mixed / All Domains' },
  { value: 'QUANTITATIVE', label: 'Quantitative' },
  { value: 'LOGICAL', label: 'Logical' },
  { value: 'VERBAL', label: 'Verbal' },
  { value: 'REASONING', label: 'Reasoning' },
];

export default function ScheduleAssessmentModal({ cohortId }: { cohortId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('cohort_id', cohortId);
    startTransition(async () => {
      const res = await scheduleCohortAssessment(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2 shadow-sm"
      >
        <span className="material-symbols-outlined text-[18px]">add_task</span>
        Schedule Assessment
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-lg overflow-hidden">

        <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div>
            <h2 className="font-headline-md text-on-surface text-[20px] font-semibold">Schedule Assessment</h2>
            <p className="font-caption text-on-surface-variant mt-0.5">Assign a test task to all students in this cohort.</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-error-container/50 border border-error/20 rounded-lg p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-sm">error</span>
                <p className="text-on-error-container text-sm">{error}</p>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-on-surface">
                Title <span className="text-error">*</span>
              </label>
              <input
                name="title"
                required
                type="text"
                autoFocus
                placeholder="e.g. Mid-term Aptitude Mock"
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Domain */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-on-surface">Domain Focus</label>
              <div className="relative">
                <select
                  name="domain"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary appearance-none"
                >
                  {DOMAINS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
              <p className="font-caption text-on-surface-variant text-[11px]">
                "Mixed" runs a full adaptive test across all domains.
              </p>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-on-surface">Due Date</label>
              <input
                name="due_date"
                type="datetime-local"
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Instructions */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-on-surface">Instructions for Students</label>
              <textarea
                name="instructions"
                rows={3}
                placeholder="e.g. Focus on speed — you have 30 seconds per question. Review your errors afterward."
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
            </div>
          </div>

          <footer className="px-6 py-4 bg-surface-container flex justify-end gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 rounded-lg font-metric-label text-on-surface border border-outline hover:bg-surface-variant transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-lg font-metric-label bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isPending ? 'hourglass_empty' : 'add_task'}
              </span>
              {isPending ? 'Scheduling…' : 'Schedule'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
