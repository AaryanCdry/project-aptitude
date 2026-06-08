'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClass } from '@/app/actions/departments';

export default function CreateClassForm({
  departments,
  defaultDeptId,
  academicYears = [],
}: {
  departments: { id: string; name: string; course_type: string }[];
  defaultDeptId?: string;
  academicYears?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  type CreateClassResult = { error: string } | { success: true };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await createClass(fd) as CreateClassResult;
        if ('error' in res) {
          setError(res.error);
        } else {
          setOpen(false);
          router.refresh();
        }
      } catch {
        setError('Something went wrong. Please try again.');
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-xl">add</span>
        New Class
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h2 className="font-headline-md text-on-surface text-[20px] font-semibold">New Class / Section</h2>
            <p className="font-caption text-on-surface-variant mt-0.5">Add a class batch within a department.</p>
          </div>
          <button onClick={() => setOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-error-container/50 border border-error/20 rounded-lg p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="text-on-error-container text-sm font-body-md">{error}</p>
              </div>
            )}

            {/* Department */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-metric-label text-on-surface">Department</label>
              <div className="relative">
                <select name="dept_id" required defaultValue={defaultDeptId ?? ''}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary appearance-none">
                  <option value="">Select department…</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.course_type})</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Class Name + Year/Section */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-metric-label text-on-surface">Class Name</label>
              <input name="name" required type="text" placeholder="e.g. BCA-2024-A"
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-metric-label text-metric-label text-on-surface">Year</label>
                <input name="year" type="number" min={1} max={6} placeholder="e.g. 2"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="font-metric-label text-metric-label text-on-surface">Section</label>
                <input name="section" type="text" placeholder="e.g. A"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            {academicYears.length > 0 && (
              <div className="space-y-1.5">
                <label className="font-metric-label text-metric-label text-on-surface">Academic Year</label>
                <div className="relative">
                  <select name="academic_year_id" defaultValue=""
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary appearance-none">
                    <option value="">— None —</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>{ay.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
            )}
          </div>

          <footer className="px-6 py-4 bg-surface-container flex justify-end gap-3 border-t border-outline-variant">
            <button type="button" onClick={() => setOpen(false)}
              className="px-5 py-2.5 rounded-lg font-metric-label text-on-surface border border-outline hover:bg-surface-variant transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2.5 rounded-lg font-metric-label bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-60 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">{isPending ? 'hourglass_empty' : 'meeting_room'}</span>
              {isPending ? 'Creating…' : 'Create Class'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
