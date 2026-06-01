'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateDepartment, deleteDepartment } from '@/app/actions/departments';
import AddClassButton from './AddClassButton';

const COURSE_TYPES = ['BE', 'BTech', 'BCA', 'BSc', 'MBA', 'MCA', 'MTech', 'BBA', 'BCom', 'Other'];

const ACCENT: Record<string, { strip: string; icon: string; badge: string }> = {
  BE:    { strip: 'bg-primary',   icon: 'bg-primary/10 text-primary',     badge: 'bg-primary-fixed-dim text-on-primary-fixed' },
  BTech: { strip: 'bg-primary',   icon: 'bg-primary/10 text-primary',     badge: 'bg-primary-fixed-dim text-on-primary-fixed' },
  BCA:   { strip: 'bg-secondary', icon: 'bg-secondary/10 text-secondary', badge: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
  BSc:   { strip: 'bg-secondary', icon: 'bg-secondary/10 text-secondary', badge: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
  BBA:   { strip: 'bg-tertiary',  icon: 'bg-tertiary/10 text-tertiary',   badge: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  BCom:  { strip: 'bg-tertiary',  icon: 'bg-tertiary/10 text-tertiary',   badge: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  MBA:   { strip: 'bg-tertiary',  icon: 'bg-tertiary/10 text-tertiary',   badge: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  MCA:   { strip: 'bg-secondary', icon: 'bg-secondary/10 text-secondary', badge: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
  MTech: { strip: 'bg-primary',   icon: 'bg-primary/10 text-primary',     badge: 'bg-primary-fixed-dim text-on-primary-fixed' },
};
const DEFAULT_ACCENT = { strip: 'bg-outline', icon: 'bg-surface-container text-on-surface-variant', badge: 'bg-surface-container-high text-on-surface' };

interface Dept {
  id: string;
  name: string;
  course_type: string | null;
  semester_count: number;
  classCount: number;
  created_at: string;
}

export default function DepartmentCard({ dept }: { dept: Dept }) {
  const router = useRouter();
  const accent = ACCENT[dept.course_type ?? ''] ?? DEFAULT_ACCENT;

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Body scroll lock when modal is open ───────────────────────────────────
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (editOpen) {
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
  }, [editOpen]);
  const [name, setName] = useState(dept.name);
  const [courseType, setCourseType] = useState(dept.course_type ?? '');
  const [semCount, setSemCount] = useState(String(dept.semester_count));
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    startSave(async () => {
      const res = await updateDepartment(dept.id, {
        name: name.trim(),
        course_type: courseType || null,
        semester_count: Math.max(1, parseInt(semCount, 10) || dept.semester_count),
      });
      if ('error' in res && res.error) { setEditError(res.error); return; }
      setEditOpen(false);
      router.refresh();
    });
  }

  // ── Delete state ──────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startDelete(async () => {
      const res = await deleteDepartment(dept.id);
      if ('error' in res && res.error) { setDeleteError(res.error); return; }
      router.refresh();
    });
  }

  const inputCls = 'w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group relative">
        {/* Colored accent strip */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent.strip} rounded-t-2xl`} />

        {/* Card Header */}
        <div className="px-5 pt-5 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent.icon}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>account_tree</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface text-[15px] group-hover:text-primary transition-colors leading-tight">{dept.name}</p>
              <p className="font-caption text-on-surface-variant text-[12px] mt-0.5">{dept.semester_count} semesters</p>
            </div>
          </div>
          {dept.course_type && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0 ${accent.badge}`}>
              {dept.course_type}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="mx-5 mb-4 grid grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/50">
          <div className="text-center">
            <p className="font-caption text-on-surface-variant text-[10px] uppercase tracking-wider mb-1">Classes</p>
            <p className="font-bold text-on-surface text-[20px] tabular-nums leading-none">{dept.classCount}</p>
          </div>
          <div className="text-center border-x border-outline-variant/50">
            <p className="font-caption text-on-surface-variant text-[10px] uppercase tracking-wider mb-1">Semesters</p>
            <p className="font-bold text-on-surface text-[20px] tabular-nums leading-none">{dept.semester_count}</p>
          </div>
          <div className="text-center">
            <p className="font-caption text-on-surface-variant text-[10px] uppercase tracking-wider mb-1">Created</p>
            <p className="font-caption text-on-surface text-[11px] leading-tight mt-1">
              {new Date(dept.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <AddClassButton dept={{ id: dept.id, name: dept.name, course_type: dept.course_type ?? '' }} />
          <Link
            href={`/admin/classes?dept=${dept.id}`}
            className="px-3 py-2 text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-1 font-metric-label text-[13px]"
          >
            <span className="material-symbols-outlined text-[16px]">list</span>
            View
          </Link>
          <button
            onClick={() => { setEditOpen(true); setName(dept.name); setCourseType(dept.course_type ?? ''); setSemCount(String(dept.semester_count)); setEditError(null); }}
            className="px-3 py-2 text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-low hover:text-primary transition-colors flex items-center gap-1 font-metric-label text-[13px]"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
          {confirmDelete ? (
            <div className="flex gap-1.5 ml-auto">
              {deleteError && <p className="text-error text-[11px] self-center">{deleteError}</p>}
              <button onClick={() => { setConfirmDelete(false); setDeleteError(null); }} className="px-2 py-1.5 text-[12px] border border-outline-variant rounded-lg font-metric-label text-on-surface-variant hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="px-2 py-1.5 text-[12px] bg-error text-on-error rounded-lg font-metric-label hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">{isDeleting ? 'hourglass_empty' : 'delete'}</span>
                {isDeleting ? '…' : 'Confirm'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto p-2 text-outline hover:text-error border border-outline-variant rounded-lg hover:border-error/30 hover:bg-error-container/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Edit Modal (portal — avoids transform contamination from card hover) */}
      {mounted && createPortal(editOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setEditOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden animate-fade-scale pointer-events-auto">

              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>edit</span>
                  <h2 className="font-headline-md text-on-surface font-semibold text-base">Edit Department</h2>
                </div>
                <button onClick={() => setEditOpen(false)} className="p-1.5 text-outline hover:text-on-surface transition-colors rounded-full hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleEdit} autoComplete="off">
                <div className="px-6 py-5 space-y-4">
                  {editError && (
                    <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-base shrink-0">error</span>
                      {editError}
                    </div>
                  )}

                  <div>
                    <label className="block font-metric-label text-on-surface text-[12px] mb-1.5">Department Name <span className="text-error">*</span></label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required autoComplete="off" className={inputCls} placeholder="e.g. Computer Science" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-metric-label text-on-surface text-[12px] mb-1.5">Course Type</label>
                      <select value={courseType} onChange={e => setCourseType(e.target.value)} className={inputCls}>
                        <option value="">— None —</option>
                        {COURSE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-metric-label text-on-surface text-[12px] mb-1.5">Semesters</label>
                      <input type="number" value={semCount} onChange={e => setSemCount(e.target.value)} min={1} max={12} autoComplete="off" className={inputCls} />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/40 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-lg font-metric-label text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors border border-outline-variant">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving || !name.trim()} className="px-5 py-2 rounded-lg font-metric-label text-sm bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSaving ? (
                      <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Saving…</>
                    ) : (
                      <><span className="material-symbols-outlined text-[16px]">check</span>Save Changes</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : null, document.body)}
    </>
  );
}
