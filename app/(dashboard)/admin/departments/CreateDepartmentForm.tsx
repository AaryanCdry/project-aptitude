'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDepartment } from '@/app/actions/departments';

const COURSE_TYPES = ['BE', 'BTech', 'BCA', 'BSc', 'MBA', 'MCA', 'MTech', 'BBA', 'BCom', 'Other'];

export default function CreateDepartmentForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createDepartment(fd);
      if ((res as any).error) {
        setError((res as any).error);
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
        className="px-6 py-3 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-xl">add</span>
        New Department
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h2 className="font-headline-md text-on-surface text-[20px] font-semibold">New Department</h2>
            <p className="font-caption text-on-surface-variant mt-0.5">Add an academic department to your college.</p>
          </div>
          <button onClick={() => setOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-error-container/50 border border-error/20 rounded-lg p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">error</span>
                <p className="font-body-md text-on-error-container text-sm">{error}</p>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label className="font-metric-label text-metric-label text-on-surface" htmlFor="dept-name">Department Name</label>
              <input id="dept-name" name="name" required type="text" placeholder="e.g. Computer Science"
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
            </div>

            {/* Course Type + Semesters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-metric-label text-metric-label text-on-surface" htmlFor="course-type">Course Type</label>
                <div className="relative">
                  <select id="course-type" name="course_type"
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary appearance-none">
                    <option value="">Select…</option>
                    {COURSE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-metric-label text-metric-label text-on-surface" htmlFor="sem-count">Semesters</label>
                <input id="sem-count" name="semester_count" type="number" min={1} max={12} defaultValue={6}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
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
              <span className="material-symbols-outlined text-[16px]">{isPending ? 'hourglass_empty' : 'add'}</span>
              {isPending ? 'Creating…' : 'Create Department'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
