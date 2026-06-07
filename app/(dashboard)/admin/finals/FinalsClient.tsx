'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createFinalDraft, cancelFinal, rescheduleFinal, updateFinalAssessment, assignFinalToClass } from '@/app/actions/finals';

interface FinalRow {
  id: string;
  scheduled_at: string | null;
  status: string;
  completed_at: string | null;
  studentName: string;
  className: string | null;
  score: number | null;
  certTier: string | null;
  badgeTier: string | null;
}

interface Assessment {
  id: string;
  title: string;
  scheduled_at: string | null;
  due_date: string | null;
  class_ids: string[];
  class_names: string[];
  domain_quotas: Record<string, number>;
  totalStudents: number;
  completedStudents: number;
}

interface BatchOption {
  id: string;
  name: string;
  classes: Array<{ id: string; name: string }>;
}

interface Data {
  finals: FinalRow[];
  classes: Array<{ id: string; name: string }>;
  assessments: Assessment[];
  batches: BatchOption[];
}

const STATUS_CHIP: Record<string, string> = {
  SCHEDULED:   'bg-surface-container-high text-on-surface border border-outline-variant',
  IN_PROGRESS: 'bg-primary-fixed-dim text-on-primary-fixed',
  COMPLETED:   'bg-secondary-fixed text-on-secondary-fixed-variant',
};

const TIER_CHIP: Record<string, string> = {
  ADVANCED:     'bg-error-container text-on-error-container',
  INTERMEDIATE: 'bg-primary-fixed-dim text-on-primary-fixed',
  BASIC:        'bg-secondary-fixed text-on-secondary-fixed-variant',
};

const QUOTA_DOMAINS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'SPATIAL'] as const;

export default function FinalsClient({ initialData }: { initialData: Data }) {
  const router = useRouter();
  const [actionPending, startAction] = useTransition();
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const f of initialData.finals) {
      if (f.className && !seen.has(f.className)) { seen.add(f.className); out.push(f.className); }
    }
    return out.sort();
  }, [initialData.finals]);

  const filtered = useMemo(() => initialData.finals.filter(f => {
    if (classFilter && f.className !== classFilter) return false;
    if (statusFilter && f.status !== statusFilter) return false;
    return true;
  }), [initialData.finals, classFilter, statusFilter]);

  // ── Row action state ──────────────────────────────────────────────────────
  const [cancelRow, setCancelRow] = useState<string | null>(null);
  const [rescheduleRow, setRescheduleRow] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState('');

  // ── Assessment management state ───────────────────────────────────────────
  const [editAssessmentId, setEditAssessmentId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [assignAssessmentId, setAssignAssessmentId] = useState<string | null>(null);
  const [assignClassId, setAssignClassId] = useState('');

  // ── Schedule form state ───────────────────────────────────────────────────
  const [formPending, startForm] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [addClassId, setAddClassId] = useState('');

  function toDatetimeLocal(iso: string | null) {
    if (!iso) return '';
    return new Date(iso).toISOString().slice(0, 16);
  }

  function handleBatchChange(batchId: string) {
    setSelectedBatchId(batchId);
    if (!batchId) return;
    const batch = initialData.batches.find(b => b.id === batchId);
    if (!batch) return;
    const batchClassIds = batch.classes.map(c => c.id);
    setSelectedClassIds(prev => [...new Set([...prev, ...batchClassIds])]);
  }

  function handleAddClass() {
    if (!addClassId || selectedClassIds.includes(addClassId)) return;
    setSelectedClassIds(prev => [...prev, addClassId]);
    setAddClassId('');
  }

  function handleRemoveClass(classId: string) {
    setSelectedClassIds(prev => prev.filter(id => id !== classId));
  }

  function handleScheduleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    startForm(async () => {
      const res = await createFinalDraft(fd);
      if ('error' in res && res.error) { setFormError(res.error); return; }
      router.push(`/schedule-test/${(res as any).assessmentId}/questions?returnTo=/admin/finals`);
    });
  }

  function handleCancel(testId: string) {
    startAction(async () => {
      const res = await cancelFinal(testId);
      if ('error' in res && res.error) { setFlash({ kind: 'err', text: res.error }); return; }
      setCancelRow(null);
      setFlash({ kind: 'ok', text: 'Final exam cancelled.' });
      router.refresh();
    });
  }

  function handleReschedule(testId: string) {
    if (!rescheduleValue) return;
    startAction(async () => {
      const res = await rescheduleFinal(testId, rescheduleValue);
      if ('error' in res && res.error) { setFlash({ kind: 'err', text: res.error }); return; }
      setRescheduleRow(null);
      setFlash({ kind: 'ok', text: 'Rescheduled.' });
      router.refresh();
    });
  }

  function handleUpdateAssessment(assessmentId: string) {
    startAction(async () => {
      const res = await updateFinalAssessment(assessmentId, {
        title: editTitle,
        scheduled_at: editScheduledAt || null,
        due_date: editDueDate || null,
      });
      if ('error' in res && res.error) { setFlash({ kind: 'err', text: res.error }); return; }
      setEditAssessmentId(null);
      setFlash({ kind: 'ok', text: 'Assessment updated.' });
      router.refresh();
    });
  }

  function handleAssignToClass(assessmentId: string) {
    if (!assignClassId) return;
    startAction(async () => {
      const res = await assignFinalToClass(assessmentId, assignClassId);
      if ('error' in res && res.error) { setFlash({ kind: 'err', text: res.error }); return; }
      setAssignAssessmentId(null);
      setAssignClassId('');
      const count = (res as any).scheduled ?? 0;
      setFlash({ kind: 'ok', text: `Assigned to class — ${count} new test${count === 1 ? '' : 's'} created.` });
      router.refresh();
    });
  }

  const inputCls = 'w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline-md text-2xl text-on-surface">Final Exams</h1>
        <p className="font-body-md text-on-surface-variant mt-1 flex flex-wrap items-center gap-1.5">
          Schedule final exams with curated questions. Certificates &amp; badges are auto-issued on completion:
          <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-xs">≥90 Advanced</span>
          <span className="px-2 py-0.5 rounded-full bg-primary-fixed-dim text-on-primary-fixed text-xs">≥80 Intermediate</span>
          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs">≥70 Basic</span>
        </p>
      </div>

      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
          {flash.text}
        </div>
      )}

      {/* ── Schedule Final Form ──────────────────────────────────────────── */}
      <form
        onSubmit={handleScheduleSubmit}
        autoComplete="off"
        className="max-w-2xl bg-surface-container rounded-xl border border-outline-variant p-6 mb-8 space-y-4"
      >
        <h2 className="font-headline-md text-lg text-on-surface">Schedule Final Exam</h2>
        <p className="font-caption text-on-surface-variant text-sm -mt-2">
          After submitting, you'll curate the question pool before finalizing.
        </p>

        {formError && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            {formError}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">
            Title <span className="text-error">*</span>
          </label>
          <input name="title" required type="text" placeholder="e.g. BCA Final Exam 2026" autoComplete="off" className={inputCls} />
        </div>

        {/* Batch selector (optional) */}
        {initialData.batches.length > 0 && (
          <div>
            <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">
              <span className="material-symbols-outlined text-[13px] align-middle mr-1" style={{ fontVariationSettings: '"FILL" 1' }}>groups</span>
              Fill from Batch <span className="text-on-surface-variant font-normal normal-case">(optional)</span>
            </label>
            <select value={selectedBatchId} onChange={e => handleBatchChange(e.target.value)} className={inputCls}>
              <option value="">Select a batch to auto-fill classes…</option>
              {initialData.batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.classes.length} classes)</option>
              ))}
            </select>
          </div>
        )}

        {/* Class multi-picker */}
        <div>
          <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">
            Target Classes <span className="text-error">*</span>
          </label>
          <input type="hidden" name="class_ids" value={selectedClassIds.join(',')} readOnly />

          {/* Selected class chips */}
          {selectedClassIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedClassIds.map(id => {
                const cls = initialData.classes.find(c => c.id === id);
                return (
                  <div key={id} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1 text-sm">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
                    {cls?.name ?? id}
                    <button type="button" onClick={() => handleRemoveClass(id)} className="ml-0.5 hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add individual class */}
          <div className="flex gap-2">
            <select value={addClassId} onChange={e => setAddClassId(e.target.value)} className={`flex-1 ${inputCls}`}>
              <option value="">Add individual class…</option>
              {initialData.classes.filter(c => !selectedClassIds.includes(c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="button" onClick={handleAddClass} disabled={!addClassId} className="px-3 py-2 border border-outline-variant rounded-lg text-sm text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors">
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
          {selectedClassIds.length === 0 && (
            <p className="font-caption text-on-surface-variant text-xs mt-1">Select a batch above or add classes individually.</p>
          )}
        </div>

        {/* Domain quotas */}
        <div>
          <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-2">Questions per Domain</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUOTA_DOMAINS.map(d => (
              <div key={d}>
                <label className="block font-caption text-on-surface-variant text-[11px] mb-1">{d.charAt(0) + d.slice(1).toLowerCase()}</label>
                <input name={`quota_${d}`} type="number" min={0} max={50} defaultValue={0} className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">Available From</label>
            <input name="scheduled_at" type="datetime-local" className={inputCls} />
          </div>
          <div>
            <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">Due Date</label>
            <input name="due_date" type="datetime-local" className={inputCls} />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">
            Duration (minutes) <span className="text-error">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input name="duration_minutes" type="number" min={5} max={180} step={5} defaultValue={45} required className={`${inputCls} w-28`} />
            <span className="font-caption text-on-surface-variant">minutes for the entire exam (5–180)</span>
          </div>
        </div>

        <input type="hidden" name="test_type" value="FINAL" />
        {selectedBatchId && <input type="hidden" name="batch_id" value={selectedBatchId} />}

        <div className="flex justify-end pt-2 border-t border-outline-variant">
          <button
            type="submit"
            disabled={formPending || selectedClassIds.length === 0}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {formPending ? (
              <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Creating…</>
            ) : (
              <><span className="material-symbols-outlined text-sm">arrow_forward</span>Next: Select Questions</>
            )}
          </button>
        </div>
      </form>

      {/* ── Assessment Management ───────────────────────────────────────── */}
      {initialData.assessments.length > 0 && (
        <div className="mb-8">
          <h2 className="font-headline-md text-lg text-on-surface mb-3">Final Assessments</h2>
          <div className="flex flex-col gap-3">
            {initialData.assessments.map(a => {
              const availableClasses = initialData.classes.filter(c => !a.class_ids.includes(c.id));
              const isEditing = editAssessmentId === a.id;
              const isAssigning = assignAssessmentId === a.id;

              return (
                <div key={a.id} className="bg-surface-container rounded-xl border border-outline-variant p-5">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">Title</label>
                        <input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className={inputCls}
                          type="text"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">Available From</label>
                          <input type="datetime-local" value={editScheduledAt} onChange={e => setEditScheduledAt(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">Due Date</label>
                          <input type="datetime-local" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} className={inputCls} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-outline-variant">
                        <button
                          onClick={() => handleUpdateAssessment(a.id)}
                          disabled={actionPending || !editTitle.trim()}
                          className="px-4 py-2 bg-primary text-on-primary text-sm font-metric-label rounded-lg disabled:opacity-50"
                        >
                          {actionPending ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setEditAssessmentId(null)}
                          className="px-4 py-2 border border-outline-variant text-on-surface-variant text-sm rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-headline-md text-on-surface text-base">{a.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant border border-outline-variant">
                            {a.completedStudents}/{a.totalStudents} completed
                          </span>
                        </div>
                        {a.class_names.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {a.class_names.map(n => (
                              <span key={n} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{n}</span>
                            ))}
                          </div>
                        )}
                        <p className="font-caption text-on-surface-variant text-xs">
                          {a.scheduled_at ? `From: ${new Date(a.scheduled_at).toLocaleString()}` : 'No start date'}
                          {a.due_date ? ` · Due: ${new Date(a.due_date).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setEditAssessmentId(a.id);
                            setEditTitle(a.title);
                            setEditScheduledAt(toDatetimeLocal(a.scheduled_at));
                            setEditDueDate(toDatetimeLocal(a.due_date));
                            setAssignAssessmentId(null);
                          }}
                          className="px-3 py-1.5 text-xs border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Edit
                        </button>
                        {availableClasses.length > 0 && (
                          <button
                            onClick={() => { setAssignAssessmentId(a.id); setEditAssessmentId(null); setAssignClassId(''); }}
                            className="px-3 py-1.5 text-xs bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            Assign Class
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {isAssigning && !isEditing && (
                    <div className="mt-4 pt-4 border-t border-outline-variant flex items-end gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <label className="block font-metric-label text-on-surface text-xs uppercase tracking-wider mb-1.5">Add Class</label>
                        <select
                          value={assignClassId}
                          onChange={e => setAssignClassId(e.target.value)}
                          className={inputCls}
                        >
                          <option value="">Select class…</option>
                          {availableClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 pb-0.5">
                        <button
                          onClick={() => handleAssignToClass(a.id)}
                          disabled={actionPending || !assignClassId}
                          className="px-4 py-2.5 bg-primary text-on-primary text-sm font-metric-label rounded-lg disabled:opacity-50"
                        >
                          {actionPending ? 'Assigning…' : 'Assign'}
                        </button>
                        <button
                          onClick={() => setAssignAssessmentId(null)}
                          className="px-4 py-2.5 border border-outline-variant text-on-surface-variant text-sm rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Results Table ────────────────────────────────────────────────── */}
      <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline-md text-lg text-on-surface">Scheduled &amp; Completed Finals</h2>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Class filter */}
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-outline-variant rounded-lg bg-surface text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All classes</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Status chips */}
            <div className="flex gap-1">
              {['', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-metric-label transition-colors ${
                    statusFilter === s
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {s === '' ? 'All' : s === 'IN_PROGRESS' ? 'In Progress' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            {initialData.finals.length === 0 ? 'No final exams scheduled yet.' : 'No results match the current filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-high">
                <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Class</th>
                  <th className="px-5 py-3">Scheduled</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Certificate</th>
                  <th className="px-5 py-3">Badge</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-t border-outline-variant align-top">
                    <td className="px-5 py-3 font-body-md text-on-surface">{t.studentName}</td>
                    <td className="px-5 py-3 font-body-md text-on-surface-variant">{t.className ?? '—'}</td>

                    {/* Scheduled date — inline reschedule input when active */}
                    <td className="px-5 py-3 font-body-md text-on-surface-variant">
                      {rescheduleRow === t.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="datetime-local"
                            value={rescheduleValue}
                            onChange={e => setRescheduleValue(e.target.value)}
                            className="px-2 py-1 text-xs border border-outline-variant rounded-lg bg-surface focus:outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => handleReschedule(t.id)}
                            disabled={actionPending || !rescheduleValue}
                            className="px-2 py-1 text-xs bg-primary text-on-primary rounded-lg disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setRescheduleRow(null)}
                            className="px-2 py-1 text-xs border border-outline-variant rounded-lg text-on-surface-variant"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        t.scheduled_at ? new Date(t.scheduled_at).toLocaleString() : '—'
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-metric-label ${STATUS_CHIP[t.status] ?? STATUS_CHIP.SCHEDULED}`}>
                        {t.status === 'IN_PROGRESS' ? 'In Progress' : t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                      </span>
                    </td>

                    <td className="px-5 py-3 font-body-md text-on-surface-variant tabular-nums">
                      {t.status === 'COMPLETED' && t.score != null ? `${t.score}%` : '—'}
                    </td>

                    <td className="px-5 py-3">
                      {t.status !== 'COMPLETED' ? <span className="text-on-surface-variant text-sm">—</span>
                        : t.certTier
                          ? <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-metric-label ${TIER_CHIP[t.certTier]}`}>{t.certTier}</span>
                          : <span className="text-on-surface-variant text-xs">Below 70%</span>
                      }
                    </td>

                    <td className="px-5 py-3">
                      {t.status !== 'COMPLETED' ? <span className="text-on-surface-variant text-sm">—</span>
                        : t.badgeTier
                          ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-metric-label ${TIER_CHIP[t.badgeTier]}`}>
                              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
                              {t.badgeTier}
                            </span>
                          )
                          : <span className="text-on-surface-variant text-xs">—</span>
                      }
                    </td>

                    {/* Actions — only for SCHEDULED rows */}
                    <td className="px-5 py-3">
                      {t.status === 'SCHEDULED' && (
                        cancelRow === t.id ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-on-surface-variant">Confirm cancel?</span>
                            <button
                              onClick={() => handleCancel(t.id)}
                              disabled={actionPending}
                              className="px-2 py-1 text-xs bg-error text-on-error rounded-lg disabled:opacity-50"
                            >
                              {actionPending ? '…' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setCancelRow(null)}
                              className="px-2 py-1 text-xs border border-outline-variant rounded-lg text-on-surface-variant"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setRescheduleRow(t.id); setRescheduleValue(toDatetimeLocal(t.scheduled_at)); setCancelRow(null); }}
                              className="p-1 text-on-surface-variant hover:text-primary border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors"
                              title="Reschedule"
                            >
                              <span className="material-symbols-outlined text-[15px]">schedule</span>
                            </button>
                            <button
                              onClick={() => { setCancelRow(t.id); setRescheduleRow(null); }}
                              className="p-1 text-outline hover:text-error border border-outline-variant rounded-lg hover:bg-error-container/20 hover:border-error/30 transition-colors"
                              title="Cancel final"
                            >
                              <span className="material-symbols-outlined text-[15px]">cancel</span>
                            </button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
