'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClass } from '@/app/actions/departments';

export default function AddClassButton({
  dept,
}: {
  dept: { id: string; name: string; course_type: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createClass(fd);
      if ((res as any).error) {
        setError((res as any).error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  const modal = open ? (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div>
            <h2 className="font-headline-md text-on-surface text-[18px] font-semibold">Add Class</h2>
            <p className="font-caption text-on-surface-variant mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">account_tree</span>
              {dept.name}
              {dept.course_type && (
                <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{dept.course_type}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <input type="hidden" name="dept_id" value={dept.id} />

          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-error-container/50 border border-error/20 rounded-lg p-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-error">error</span>
                <p className="text-on-error-container text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-metric-label text-on-surface">Class Name</label>
              <input
                name="name"
                required
                type="text"
                placeholder="e.g. BCA-2024-A"
                autoFocus
                autoComplete="off"
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-metric-label text-on-surface">Year</label>
                <div className="relative">
                  <select
                    name="year"
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary appearance-none"
                  >
                    <option value="">—</option>
                    {[1,2,3,4,5,6].map(y => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-metric-label text-on-surface">Section</label>
                <input
                  name="section"
                  type="text"
                  placeholder="e.g. A"
                  autoComplete="off"
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
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
                {isPending ? 'hourglass_empty' : 'add'}
              </span>
              {isPending ? 'Adding…' : 'Add Class'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 py-2 text-center bg-primary text-on-primary rounded-lg font-metric-label text-[13px] hover:bg-on-primary-fixed-variant transition-colors"
      >
        + Add Class
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
