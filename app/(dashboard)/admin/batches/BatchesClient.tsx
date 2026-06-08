'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createBatch, updateBatch, archiveBatch, deleteBatch,
  assignClassToBatch, removeClassFromBatch, setBatchAcademicYear,
} from '@/app/actions/batches';
import {
  createAcademicYear, updateAcademicYear, setCurrentAcademicYear, deleteAcademicYear,
  type AcademicYear,
} from '@/app/actions/academic-years';

type BatchClass = { id: string; name: string };
type Batch = {
  id: string; name: string; start_date: string | null; end_date: string | null;
  status: 'ACTIVE' | 'ARCHIVED'; classes: BatchClass[]; classCount: number; studentCount: number;
  currentAcademicYearId: string | null;
  currentAcademicYearName: string | null;
};
type AllClass = { id: string; name: string; batchId: string | null };

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const inputCls = 'w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';
const btnPrimary = 'inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:bg-primary/90 transition-colors disabled:opacity-50';
const btnOutline = 'inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant text-on-surface-variant rounded-lg font-caption text-xs hover:bg-surface-container transition-colors disabled:opacity-50';

export default function BatchesClient({
  batches, allClasses, academicYears,
}: {
  batches: Batch[];
  allClasses: AllClass[];
  academicYears: AcademicYear[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<'batches' | 'academic-years'>('batches');

  // ── Batch state ───────────────────────────────────────────────────────────
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignClass, setAssignClass] = useState<Record<string, string>>({});
  const [batchAySel, setBatchAySel] = useState<Record<string, string>>({});

  // ── Academic year state ───────────────────────────────────────────────────
  const [ayCreating, setAyCreating] = useState(false);
  const [ayName, setAyName] = useState('');
  const [ayStart, setAyStart] = useState('');
  const [ayEnd, setAyEnd] = useState('');
  const [ayIsCurrent, setAyIsCurrent] = useState(false);
  const [ayEditId, setAyEditId] = useState<string | null>(null);
  const [ayEditName, setAyEditName] = useState('');
  const [ayEditStart, setAyEditStart] = useState('');
  const [ayEditEnd, setAyEditEnd] = useState('');

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(kind: 'ok' | 'err', text: string) {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ kind, text });
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }

  // ── Batch handlers ────────────────────────────────────────────────────────
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('name', newName);
    fd.set('start_date', newStart);
    fd.set('end_date', newEnd);
    startTransition(async () => {
      const res = await createBatch(fd);
      if ('error' in res) { notify('err', res.error!); return; }
      setCreating(false); setNewName(''); setNewStart(''); setNewEnd('');
      notify('ok', 'Batch created.');
      router.refresh();
    });
  }

  function handleUpdate(batchId: string) {
    startTransition(async () => {
      const res = await updateBatch(batchId, { name: editName, start_date: editStart || null, end_date: editEnd || null });
      if ('error' in res) { notify('err', res.error!); return; }
      setEditId(null);
      notify('ok', 'Batch updated.');
      router.refresh();
    });
  }

  function handleArchive(batchId: string, archive: boolean) {
    startTransition(async () => {
      const res = await archiveBatch(batchId, archive);
      if ('error' in res) { notify('err', res.error!); return; }
      notify('ok', archive ? 'Batch archived.' : 'Batch restored.');
      router.refresh();
    });
  }

  function handleDelete(batchId: string) {
    startTransition(async () => {
      const res = await deleteBatch(batchId);
      if ('error' in res) { notify('err', res.error!); return; }
      notify('ok', 'Batch deleted.');
      router.refresh();
    });
  }

  function handleAssign(batchId: string) {
    const classId = assignClass[batchId];
    if (!classId) return;
    startTransition(async () => {
      const res = await assignClassToBatch(classId, batchId);
      if ('error' in res) { notify('err', res.error!); return; }
      setAssignClass(prev => ({ ...prev, [batchId]: '' }));
      notify('ok', 'Class assigned to batch.');
      router.refresh();
    });
  }

  function handleRemove(classId: string) {
    startTransition(async () => {
      const res = await removeClassFromBatch(classId);
      if ('error' in res) { notify('err', res.error!); return; }
      notify('ok', 'Class removed from batch.');
      router.refresh();
    });
  }

  function handleSetBatchAY(batchId: string, currentAyId: string | null) {
    const ayId = batchAySel[batchId] ?? currentAyId ?? '';
    startTransition(async () => {
      const res = await setBatchAcademicYear(batchId, ayId || null);
      if ('error' in res) { notify('err', res.error!); return; }
      notify('ok', 'Academic year applied to all classes in batch.');
      router.refresh();
    });
  }

  // ── Academic year handlers ────────────────────────────────────────────────
  function handleAyCreate(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set('name', ayName);
    fd.set('start_date', ayStart);
    fd.set('end_date', ayEnd);
    fd.set('is_current', ayIsCurrent ? 'true' : 'false');
    startTransition(async () => {
      const res = await createAcademicYear(fd);
      if ('error' in res) { notify('err', res.error!); return; }
      setAyCreating(false); setAyName(''); setAyStart(''); setAyEnd(''); setAyIsCurrent(false);
      notify('ok', 'Academic year created.');
      router.refresh();
    });
  }

  function handleAyUpdate(id: string) {
    startTransition(async () => {
      const res = await updateAcademicYear(id, { name: ayEditName, start_date: ayEditStart || null, end_date: ayEditEnd || null });
      if ('error' in res) { notify('err', res.error!); return; }
      setAyEditId(null);
      notify('ok', 'Academic year updated.');
      router.refresh();
    });
  }

  function handleAySetCurrent(id: string) {
    startTransition(async () => {
      const res = await setCurrentAcademicYear(id);
      if ('error' in res) { notify('err', res.error!); return; }
      notify('ok', 'Current academic year updated.');
      router.refresh();
    });
  }

  function handleAyDelete(id: string, name: string) {
    if (!confirm(`Delete academic year "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteAcademicYear(id);
      if ('error' in res) { notify('err', res.error!); return; }
      notify('ok', 'Academic year deleted.');
      router.refresh();
    });
  }

  const unassignedClasses = allClasses.filter(c => !c.batchId);

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display-sm text-on-background mb-2">Batches &amp; Academic Years</h1>
          <p className="font-body-md text-on-surface-variant">
            Manage graduating cohorts (batches) and calendar year cycles (academic years) separately.
          </p>
        </div>
        {activeTab === 'batches' ? (
          <button onClick={() => setCreating(true)} className={btnPrimary}>
            <span className="material-symbols-outlined text-sm">add</span>
            New Batch
          </button>
        ) : (
          <button onClick={() => setAyCreating(true)} className={btnPrimary}>
            <span className="material-symbols-outlined text-sm">add</span>
            New Academic Year
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex space-x-1 border border-outline-variant rounded-lg p-1 bg-surface-container-low w-fit mb-6">
        {(['batches', 'academic-years'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 font-metric-label text-[13px] rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/50'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {tab === 'batches' ? 'Batches' : 'Academic Years'}
          </button>
        ))}
      </div>

      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
          <span className="material-symbols-outlined text-base">{flash.kind === 'ok' ? 'check_circle' : 'error'}</span>
          {flash.text}
        </div>
      )}

      {/* ── BATCHES TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'batches' && (
        <>
          {creating && (
            <form onSubmit={handleCreate} className="bg-surface-container-lowest border border-primary/30 rounded-xl p-5 mb-6 space-y-4">
              <h3 className="font-headline-md text-on-surface text-base">New Batch</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-metric-label text-xs uppercase tracking-wider text-on-surface-variant mb-1.5">Name <span className="text-error">*</span></label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} required className={inputCls} placeholder="e.g. BCA 2024–2027" />
                </div>
                <div>
                  <label className="block font-metric-label text-xs uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                  <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-metric-label text-xs uppercase tracking-wider text-on-surface-variant mb-1.5">End Date</label>
                  <input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={pending} className={btnPrimary}>Create Batch</button>
                <button type="button" onClick={() => setCreating(false)} className={btnOutline}>Cancel</button>
              </div>
            </form>
          )}

          {batches.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-outline block mb-3" style={{ fontVariationSettings: '"FILL" 1' }}>groups</span>
              <h3 className="font-headline-md text-on-surface mb-2">No batches yet</h3>
              <p className="font-body-md text-on-surface-variant mb-6">Create a batch and assign classes to it.</p>
              <button onClick={() => setCreating(true)} className={btnPrimary}>Create First Batch</button>
            </div>
          ) : (
            <div className="space-y-3">
              {batches.map(batch => {
                const isExpanded = expandedId === batch.id;
                const isEditing = editId === batch.id;
                const availableToAssign = unassignedClasses;

                return (
                  <div key={batch.id} className={`bg-surface-container-lowest border rounded-xl overflow-hidden shadow-sm transition-all ${batch.status === 'ARCHIVED' ? 'border-outline-variant opacity-60' : 'border-outline-variant'}`}>
                    <div className="flex items-center gap-4 px-5 py-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : batch.id)}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <span className="material-symbols-outlined text-on-surface-variant text-sm transition-transform" style={{ display: 'block', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                          chevron_right
                        </span>
                      </button>

                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>groups</span>
                      </div>

                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} placeholder="Batch name" />
                          <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} className={inputCls} />
                          <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} className={inputCls} />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[14px] text-on-surface">{batch.name}</p>
                            {batch.status === 'ARCHIVED' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-bold">ARCHIVED</span>
                            )}
                            {batch.currentAcademicYearName && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-medium">
                                <span className="material-symbols-outlined text-[11px]">calendar_month</span>
                                {batch.currentAcademicYearName}
                              </span>
                            )}
                          </div>
                          <p className="font-caption text-on-surface-variant text-[12px] mt-0.5">
                            {fmtDate(batch.start_date)} — {fmtDate(batch.end_date)}
                          </p>
                        </div>
                      )}

                      <div className="hidden md:flex items-center gap-6 shrink-0">
                        <div className="text-center">
                          <p className="font-bold text-on-surface text-[16px] tabular-nums">{batch.classCount}</p>
                          <p className="font-caption text-on-surface-variant text-[10px]">Classes</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-on-surface text-[16px] tabular-nums">{batch.studentCount}</p>
                          <p className="font-caption text-on-surface-variant text-[10px]">Students</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleUpdate(batch.id)} disabled={pending} className={btnPrimary}>Save</button>
                            <button onClick={() => setEditId(null)} className={btnOutline}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditId(batch.id); setEditName(batch.name); setEditStart(batch.start_date ?? ''); setEditEnd(batch.end_date ?? ''); }}
                              className={btnOutline}
                              title="Edit batch"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => handleArchive(batch.id, batch.status === 'ACTIVE')}
                              disabled={pending}
                              className={btnOutline}
                              title={batch.status === 'ACTIVE' ? 'Archive' : 'Restore'}
                            >
                              <span className="material-symbols-outlined text-sm">{batch.status === 'ACTIVE' ? 'archive' : 'unarchive'}</span>
                            </button>
                            {batch.classCount === 0 && (
                              <button
                                onClick={() => { if (confirm(`Delete batch "${batch.name}"?`)) handleDelete(batch.id); }}
                                disabled={pending}
                                className={`${btnOutline} text-error border-error/30 hover:bg-error-container/20`}
                                title="Delete batch"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-outline-variant bg-surface-container/30 p-5">
                        <h4 className="font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider mb-3">Assigned Classes</h4>

                        {batch.classes.length === 0 ? (
                          <p className="font-body-md text-on-surface-variant text-sm mb-4">No classes assigned yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {batch.classes.map(cls => (
                              <div key={cls.id} className="flex items-center gap-2 bg-surface border border-outline-variant rounded-lg px-3 py-1.5">
                                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
                                <span className="font-body-md text-on-surface text-sm">{cls.name}</span>
                                <button
                                  onClick={() => handleRemove(cls.id)}
                                  disabled={pending}
                                  className="ml-1 text-on-surface-variant hover:text-error transition-colors"
                                  title="Remove from batch"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {batch.status === 'ACTIVE' && availableToAssign.length > 0 && (
                          <div className="flex gap-2 items-center">
                            <select
                              value={assignClass[batch.id] ?? ''}
                              onChange={e => setAssignClass(prev => ({ ...prev, [batch.id]: e.target.value }))}
                              className="flex-1 max-w-xs px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                            >
                              <option value="">Add a class…</option>
                              {availableToAssign.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(batch.id)}
                              disabled={pending || !assignClass[batch.id]}
                              className={btnOutline}
                            >
                              <span className="material-symbols-outlined text-sm">add</span>
                              Assign
                            </button>
                          </div>
                        )}
                        {batch.status === 'ACTIVE' && availableToAssign.length === 0 && (
                          <p className="font-caption text-on-surface-variant text-xs">All classes are already assigned to batches.</p>
                        )}

                        {/* ── Academic Year for this batch ── */}
                        {batch.classes.length > 0 && academicYears.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-outline-variant">
                            <h4 className="font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider mb-3">Academic Year</h4>
                            {batch.currentAcademicYearName ? (
                              <p className="font-caption text-on-surface text-sm mb-3 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-secondary text-[14px]">calendar_month</span>
                                Currently: <strong>{batch.currentAcademicYearName}</strong>
                              </p>
                            ) : (
                              <p className="font-caption text-on-surface-variant text-sm mb-3 italic">No academic year set for this batch&apos;s classes.</p>
                            )}
                            <div className="flex gap-2 items-center">
                              <select
                                value={batchAySel[batch.id] ?? batch.currentAcademicYearId ?? ''}
                                onChange={e => setBatchAySel(prev => ({ ...prev, [batch.id]: e.target.value }))}
                                className="flex-1 max-w-xs px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                              >
                                <option value="">— None (clear) —</option>
                                {academicYears.map(ay => (
                                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSetBatchAY(batch.id, batch.currentAcademicYearId)}
                                disabled={pending}
                                className={btnOutline}
                              >
                                <span className="material-symbols-outlined text-sm">check</span>
                                Apply to All Classes
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            <p className="font-caption text-on-surface-variant text-xs">{batches.length} batch{batches.length !== 1 ? 'es' : ''}</p>
          </div>
        </>
      )}

      {/* ── ACADEMIC YEARS TAB ────────────────────────────────────────────── */}
      {activeTab === 'academic-years' && (
        <>
          {ayCreating && (
            <form onSubmit={handleAyCreate} className="bg-surface-container-lowest border border-primary/30 rounded-xl p-5 mb-6 space-y-4">
              <h3 className="font-headline-md text-on-surface text-base">New Academic Year</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-metric-label text-xs uppercase tracking-wider text-on-surface-variant mb-1.5">Name <span className="text-error">*</span></label>
                  <input value={ayName} onChange={e => setAyName(e.target.value)} required className={inputCls} placeholder="e.g. 2024–2025" />
                </div>
                <div>
                  <label className="block font-metric-label text-xs uppercase tracking-wider text-on-surface-variant mb-1.5">Start Date</label>
                  <input type="date" value={ayStart} onChange={e => setAyStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block font-metric-label text-xs uppercase tracking-wider text-on-surface-variant mb-1.5">End Date</label>
                  <input type="date" value={ayEnd} onChange={e => setAyEnd(e.target.value)} className={inputCls} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ayIsCurrent}
                  onChange={e => setAyIsCurrent(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded"
                />
                <span className="font-body-md text-on-surface text-sm">Set as current academic year</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={pending} className={btnPrimary}>Create</button>
                <button type="button" onClick={() => setAyCreating(false)} className={btnOutline}>Cancel</button>
              </div>
            </form>
          )}

          {academicYears.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-outline block mb-3" style={{ fontVariationSettings: '"FILL" 1' }}>calendar_month</span>
              <h3 className="font-headline-md text-on-surface mb-2">No academic years yet</h3>
              <p className="font-body-md text-on-surface-variant mb-6">Create academic years (e.g. 2024–2025) and assign them to classes.</p>
              <button onClick={() => setAyCreating(true)} className={btnPrimary}>Create First Academic Year</button>
            </div>
          ) : (
            <div className="space-y-3">
              {academicYears.map(ay => {
                const isEditing = ayEditId === ay.id;
                return (
                  <div key={ay.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>calendar_month</span>
                      </div>

                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input value={ayEditName} onChange={e => setAyEditName(e.target.value)} className={inputCls} placeholder="Academic year name" />
                          <input type="date" value={ayEditStart} onChange={e => setAyEditStart(e.target.value)} className={inputCls} />
                          <input type="date" value={ayEditEnd} onChange={e => setAyEditEnd(e.target.value)} className={inputCls} />
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[14px] text-on-surface">{ay.name}</p>
                            {ay.is_current && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">CURRENT YEAR</span>
                            )}
                          </div>
                          <p className="font-caption text-on-surface-variant text-[12px] mt-0.5">
                            {fmtDate(ay.start_date)} — {fmtDate(ay.end_date)}
                          </p>
                        </div>
                      )}

                      <div className="hidden md:flex items-center gap-6 shrink-0">
                        <div className="text-center">
                          <p className="font-bold text-on-surface text-[16px] tabular-nums">{ay.classCount}</p>
                          <p className="font-caption text-on-surface-variant text-[10px]">Classes</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleAyUpdate(ay.id)} disabled={pending} className={btnPrimary}>Save</button>
                            <button onClick={() => setAyEditId(null)} className={btnOutline}>Cancel</button>
                          </>
                        ) : (
                          <>
                            {!ay.is_current && (
                              <button
                                onClick={() => handleAySetCurrent(ay.id)}
                                disabled={pending}
                                className={btnOutline}
                                title="Set as current year"
                              >
                                <span className="material-symbols-outlined text-sm">star</span>
                                Set Current
                              </button>
                            )}
                            <button
                              onClick={() => { setAyEditId(ay.id); setAyEditName(ay.name); setAyEditStart(ay.start_date ?? ''); setAyEditEnd(ay.end_date ?? ''); }}
                              className={btnOutline}
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            {ay.classCount === 0 && (
                              <button
                                onClick={() => handleAyDelete(ay.id, ay.name)}
                                disabled={pending}
                                className={`${btnOutline} text-error border-error/30 hover:bg-error-container/20`}
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4">
            <p className="font-caption text-on-surface-variant text-xs">{academicYears.length} academic year{academicYears.length !== 1 ? 's' : ''}</p>
          </div>
        </>
      )}
    </div>
  );
}
