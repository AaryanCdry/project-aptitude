'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createBatch, updateBatch, archiveBatch, deleteBatch,
  assignClassToBatch, removeClassFromBatch,
} from '@/app/actions/batches';

type BatchClass = { id: string; name: string };
type Batch = {
  id: string; name: string; start_date: string | null; end_date: string | null;
  status: 'ACTIVE' | 'ARCHIVED'; classes: BatchClass[]; classCount: number; studentCount: number;
};
type AllClass = { id: string; name: string; batchId: string | null };

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const inputCls = 'w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';
const btnPrimary = 'inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:bg-primary/90 transition-colors disabled:opacity-50';
const btnOutline = 'inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant text-on-surface-variant rounded-lg font-caption text-xs hover:bg-surface-container transition-colors disabled:opacity-50';

export default function BatchesClient({ batches, allClasses }: { batches: Batch[]; allClasses: AllClass[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Create form state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // Expand state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Per-batch assign-class selection
  const [assignClass, setAssignClass] = useState<Record<string, string>>({});

  function notify(kind: 'ok' | 'err', text: string) {
    setFlash({ kind, text });
    setTimeout(() => setFlash(null), 4000);
  }

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

  // Classes not yet in any batch
  const unassignedClasses = allClasses.filter(c => !c.batchId);

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display-sm text-on-background mb-2">Batches &amp; Academic Years</h1>
          <p className="font-body-md text-on-surface-variant">
            Group classes into batches. Schedule tests for an entire batch at once.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className={btnPrimary}
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Batch
        </button>
      </div>

      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
          <span className="material-symbols-outlined text-base">{flash.kind === 'ok' ? 'check_circle' : 'error'}</span>
          {flash.text}
        </div>
      )}

      {/* Create form */}
      {creating && (
        <form onSubmit={handleCreate} className="bg-surface-container-lowest border border-primary/30 rounded-xl p-5 mb-6 space-y-4">
          <h3 className="font-headline-md text-on-surface text-base">New Batch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-metric-label text-xs uppercase tracking-wider text-on-surface-variant mb-1.5">Name <span className="text-error">*</span></label>
              <input value={newName} onChange={e => setNewName(e.target.value)} required className={inputCls} placeholder="e.g. 2024-25 Final Year" />
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

      {/* Batches list */}
      {batches.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline block mb-3" style={{ fontVariationSettings: '"FILL" 1' }}>groups</span>
          <h3 className="font-headline-md text-on-surface mb-2">No batches yet</h3>
          <p className="font-body-md text-on-surface-variant mb-6">Create a batch and assign classes to it. Then schedule tests for the whole batch at once.</p>
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
                {/* Batch row */}
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

                {/* Expanded classes panel */}
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

                    {/* Add class */}
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
    </div>
  );
}
