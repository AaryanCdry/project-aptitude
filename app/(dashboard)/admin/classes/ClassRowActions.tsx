'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateClass, deleteClass } from '@/app/actions/departments';

interface Dept { id: string; name: string; }
interface Cls {
  id: string;
  name: string;
  dept_id: string;
  year: number | null;
  section: string | null;
}

export default function ClassRowActions({
  cls,
  departments,
}: {
  cls: Cls;
  departments: Dept[];
}) {
  const router = useRouter();

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Body scroll lock when modal is open ──────────────────────────────────
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
  const [name, setName] = useState(cls.name);
  const [deptId, setDeptId] = useState(cls.dept_id);
  const [year, setYear] = useState(cls.year != null ? String(cls.year) : '');
  const [section, setSection] = useState(cls.section ?? '');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  function openEdit() {
    setName(cls.name); setDeptId(cls.dept_id);
    setYear(cls.year != null ? String(cls.year) : '');
    setSection(cls.section ?? '');
    setEditError(null); setEditOpen(true);
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    startSave(async () => {
      const res = await updateClass(cls.id, {
        name: name.trim(),
        dept_id: deptId,
        year: year ? parseInt(year, 10) : null,
        section: section.trim() || null,
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
    startDelete(async () => {
      const res = await deleteClass(cls.id);
      if ('error' in res && res.error) { setDeleteError(res.error); return; }
      router.refresh();
    });
  }

  const inputCls = 'w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <Link
          href={`/admin/classes/${cls.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-metric-label text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">people</span>
          Roster
        </Link>
        <button
          onClick={openEdit}
          className="p-1.5 text-on-surface-variant hover:text-secondary border border-outline-variant rounded-lg hover:bg-surface-container-low hover:border-secondary/30 transition-colors"
          title="Edit class"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            {deleteError && <p className="text-error text-[11px]">{deleteError}</p>}
            <button onClick={() => { setConfirmDelete(false); setDeleteError(null); }} className="px-2 py-1.5 text-[12px] border border-outline-variant rounded-lg font-metric-label text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="px-2 py-1.5 text-[12px] bg-error text-on-error rounded-lg font-metric-label hover:bg-error/90 disabled:opacity-50 flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[13px]">{isDeleting ? 'hourglass_empty' : 'delete'}</span>
              {isDeleting ? '…' : 'Confirm'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 text-outline hover:text-error border border-outline-variant rounded-lg hover:bg-error-container/20 hover:border-error/30 transition-colors"
            title="Delete class"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        )}
      </div>

      {/* ── Edit Modal (portal — avoids transform contamination from row hover) */}
      {mounted && createPortal(editOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setEditOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden animate-fade-scale pointer-events-auto">

              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>edit</span>
                  <h2 className="font-headline-md text-on-surface font-semibold text-base">Edit Class</h2>
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
                    <label className="block font-metric-label text-on-surface text-[12px] mb-1.5">Class Name <span className="text-error">*</span></label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required autoComplete="off" className={inputCls} placeholder="e.g. BCA-2024-A" />
                  </div>

                  <div>
                    <label className="block font-metric-label text-on-surface text-[12px] mb-1.5">Department <span className="text-error">*</span></label>
                    <select value={deptId} onChange={e => setDeptId(e.target.value)} required className={inputCls}>
                      <option value="">Select department…</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-metric-label text-on-surface text-[12px] mb-1.5">Year</label>
                      <input type="number" value={year} onChange={e => setYear(e.target.value)} min={1} max={6} autoComplete="off" className={inputCls} placeholder="e.g. 2" />
                    </div>
                    <div>
                      <label className="block font-metric-label text-on-surface text-[12px] mb-1.5">Section</label>
                      <input type="text" value={section} onChange={e => setSection(e.target.value)} autoComplete="off" className={inputCls} placeholder="e.g. A" />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/40 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-lg font-metric-label text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors border border-outline-variant">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving || !name.trim() || !deptId} className="px-5 py-2 rounded-lg font-metric-label text-sm bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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
