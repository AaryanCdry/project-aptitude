'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCohort } from '@/app/actions/cohorts';
import { getClasses } from '@/app/actions/departments';

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled', icon: 'schedule' },
  { value: 'ACTIVE', label: 'Active', icon: 'play_circle' },
  { value: 'COMPLETED', label: 'Completed', icon: 'check_circle' },
];

export default function CreateCohortModal({
  departments,
}: {
  departments: { id: string; name: string; course_type: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedDept, setSelectedDept] = useState('');
  const [classes, setClasses] = useState<{ id: string; name: string; year: number | null; section: string | null }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Fetch classes when dept changes
  useEffect(() => {
    if (!selectedDept) {
      setClasses([]);
      return;
    }
    setLoadingClasses(true);
    getClasses(selectedDept).then((data: any[]) => {
      setClasses(data.map((c: any) => ({ id: c.id, name: c.name, year: c.year, section: c.section })));
      setLoadingClasses(false);
    });
  }, [selectedDept]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCohort(fd);
      if ((res as any).error) {
        setError((res as any).error);
      } else {
        setOpen(false);
        setSelectedDept('');
        setClasses([]);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-bold font-body-md hover:bg-surface-tint transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
      >
        <span className="material-symbols-outlined">add_business</span>
        Create Cohort
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div>
            <h2 className="font-headline-md text-on-surface text-[20px] font-semibold">New Cohort</h2>
            <p className="font-caption text-on-surface-variant mt-0.5">Create a student group linked to a class.</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="bg-error-container/50 border border-error/20 rounded-lg p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="text-on-error-container text-sm">{error}</p>
              </div>
            )}

            {/* Cohort Name */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-on-surface">Cohort Name <span className="text-error">*</span></label>
              <input
                name="name"
                required
                type="text"
                autoFocus
                placeholder="e.g. BCA 2024 Batch A"
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-on-surface">Description</label>
              <textarea
                name="description"
                rows={2}
                placeholder="Brief description of this cohort…"
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
            </div>

            {/* ── Link to Institution ── */}
            <div className="border border-outline-variant/50 rounded-lg p-4 space-y-4 bg-surface-container/40">
              <p className="font-metric-label text-on-surface-variant uppercase text-[11px] tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">account_tree</span>
                Link to Department & Class
              </p>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="font-metric-label text-on-surface">Department</label>
                <div className="relative">
                  <select
                    name="dept_id"
                    value={selectedDept}
                    onChange={e => { setSelectedDept(e.target.value); }}
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary appearance-none"
                  >
                    <option value="">No department (standalone cohort)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}{d.course_type ? ` (${d.course_type})` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Class — only shown once a dept is picked */}
              {selectedDept && (
                <div className="space-y-1.5">
                  <label className="font-metric-label text-on-surface">Class / Section</label>
                  <div className="relative">
                    {loadingClasses ? (
                      <div className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline animate-spin text-sm">progress_activity</span>
                        Loading classes…
                      </div>
                    ) : (
                      <>
                        <select
                          name="class_id"
                          className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary appearance-none"
                        >
                          <option value="">No specific class</option>
                          {classes.length === 0 ? (
                            <option disabled>No classes in this department yet</option>
                          ) : classes.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}{c.year ? ` · Year ${c.year}` : ''}{c.section ? ` · Sec ${c.section}` : ''}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                      </>
                    )}
                  </div>
                  {classes.length === 0 && !loadingClasses && (
                    <p className="font-caption text-on-surface-variant text-[11px]">
                      💡 No classes yet — you can still create the cohort and link a class later.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-on-surface">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map(({ value, label, icon }) => (
                  <label key={value} className="relative cursor-pointer">
                    <input type="radio" name="status" value={value} defaultChecked={value === 'SCHEDULED'} className="peer sr-only" />
                    <div className="flex flex-col items-center gap-1 py-3 border border-outline-variant rounded-lg peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-surface-container-low transition-colors">
                      <span className="material-symbols-outlined text-on-surface-variant peer-checked:text-primary text-xl"
                        style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
                      <span className="font-metric-label text-[12px] text-on-surface-variant peer-checked:text-primary">{label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-metric-label text-on-surface">Start Date</label>
                <input type="date" name="start_date"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="font-metric-label text-on-surface">End Date</label>
                <input type="date" name="end_date"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>
          </div>

          <footer className="px-6 py-4 bg-surface-container flex justify-end gap-3 border-t border-outline-variant">
            <button type="button" onClick={() => setOpen(false)}
              className="px-5 py-2.5 rounded-lg font-metric-label text-on-surface border border-outline hover:bg-surface-variant transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2.5 rounded-lg font-metric-label bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">{isPending ? 'hourglass_empty' : 'add_business'}</span>
              {isPending ? 'Creating…' : 'Create Cohort'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
