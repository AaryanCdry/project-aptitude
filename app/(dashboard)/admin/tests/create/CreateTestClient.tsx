'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { scheduleCohortAssessment } from '@/app/actions/cohorts';

interface Cohort { id: string; name: string; class_id: string | null; dept_id: string | null }
interface ClassRow { id: string; name: string; year: number | null; section: string | null; dept_id: string; departments?: { name?: string } }

interface Props {
  role: string | null;
  cohorts: Cohort[];
  classes: ClassRow[];
}

const DOMAINS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'REASONING'];

export default function CreateTestClient({ role, cohorts, classes }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [classIds, setClassIds] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('class_ids', [...classIds].join(','));
    startTransition(async () => {
      const res = await scheduleCohortAssessment(fd);
      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
      } else {
        setFlash({ kind: 'ok', text: 'Test scheduled.' });
        (e.currentTarget as HTMLFormElement).reset();
        setClassIds(new Set());
        router.refresh();
      }
    });
  };

  const toggleClass = (id: string) => {
    const next = new Set(classIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setClassIds(next);
  };

  const scopeLabel =
    role === 'MENTOR' ? 'your assigned classes'
    : role === 'SUB_ADMIN' ? 'your department'
    : 'any class in your college';

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline-md text-2xl text-on-surface">Schedule Test</h1>
        <p className="font-body-md text-on-surface-variant mt-1">
          Create a scheduled assessment for {scopeLabel}.
        </p>
      </div>

      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
          {flash.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl bg-surface-container rounded-xl border border-outline-variant p-6 space-y-4">
        <div>
          <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Title</label>
          <input
            name="title"
            required
            placeholder="e.g. Week 3 Quantitative Practice"
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
          />
        </div>

        <div>
          <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Cohort</label>
          <select
            name="cohort_id"
            required
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
          >
            <option value="">Select cohort</option>
            {cohorts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {cohorts.length === 0 && (
            <p className="font-caption text-on-surface-variant mt-1">No cohorts in your scope yet.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Domain (optional)</label>
            <select
              name="domain"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
            >
              <option value="">Any domain</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Due date</label>
            <input
              name="due_date"
              type="datetime-local"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
            />
          </div>
        </div>

        <div>
          <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Instructions (optional)</label>
          <textarea
            name="instructions"
            rows={3}
            placeholder="Any notes or rules for students."
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest resize-y"
          />
        </div>

        <div>
          <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">
            Classes (optional — leave empty to apply to all cohort members)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-48 overflow-y-auto p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
            {classes.length === 0 ? (
              <span className="font-body-md text-on-surface-variant col-span-3">No classes available.</span>
            ) : (
              classes.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={classIds.has(c.id)}
                    onChange={() => toggleClass(c.id)}
                  />
                  <span>
                    {c.name}
                    {c.section && <span className="text-on-surface-variant"> · {c.section}</span>}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-outline-variant">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {pending ? 'Scheduling...' : 'Schedule Test'}
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
