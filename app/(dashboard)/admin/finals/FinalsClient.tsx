'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { scheduleFinalForCohort } from '@/app/actions/finals';

interface Data {
  finals: Array<{ id: string; scheduled_at: string | null; status: string; completed_at: string | null; studentName: string }>;
  cohorts: Array<{ id: string; name: string }>;
}

const STATUS_CHIP: Record<string, string> = {
  SCHEDULED:   'bg-surface-container-high text-on-surface border border-outline-variant',
  IN_PROGRESS: 'bg-primary-fixed-dim text-on-primary-fixed',
  COMPLETED:   'bg-secondary-fixed text-on-secondary-fixed-variant',
};

export default function FinalsClient({ initialData }: { initialData: Data }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await scheduleFinalForCohort(fd);
      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
      } else {
        setFlash({ kind: 'ok', text: `Final exam scheduled for ${(res as any).count} students.` });
        (e.currentTarget as HTMLFormElement).reset();
        router.refresh();
      }
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-headline-md text-2xl text-on-surface">Final Exams</h1>
        <p className="font-body-md text-on-surface-variant mt-1">
          Schedule final exams. Certificates are auto-issued on completion:
          <span className="ml-2 inline-flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-xs">≥90 Advanced</span>
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed-dim text-on-primary-fixed text-xs">≥80 Intermediate</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs">≥70 Basic</span>
          </span>
        </p>
      </div>

      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
          {flash.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl bg-surface-container rounded-xl border border-outline-variant p-6 mb-8 space-y-4">
        <h2 className="font-headline-md text-lg text-on-surface">Schedule for a cohort</h2>

        <div>
          <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Cohort</label>
          <select
            name="cohort_id"
            required
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
          >
            <option value="">Select cohort</option>
            {initialData.cohorts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Scheduled at (optional)</label>
          <input
            name="scheduled_at"
            type="datetime-local"
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
          />
          <p className="font-caption text-on-surface-variant mt-1">Leave empty to schedule for now.</p>
        </div>

        <div className="flex justify-end pt-4 border-t border-outline-variant">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {pending ? 'Scheduling...' : 'Schedule Final Exam'}
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
          </button>
        </div>
      </form>

      <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant">
          <h2 className="font-headline-md text-lg text-on-surface">Scheduled & Completed Finals</h2>
        </div>
        {initialData.finals.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">No final exams scheduled yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-surface-container-high">
              <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant">
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Scheduled</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Completed</th>
              </tr>
            </thead>
            <tbody>
              {initialData.finals.map(t => (
                <tr key={t.id} className="border-t border-outline-variant">
                  <td className="px-5 py-3 font-body-md text-on-surface">{t.studentName}</td>
                  <td className="px-5 py-3 font-body-md text-on-surface-variant">
                    {t.scheduled_at ? new Date(t.scheduled_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-metric-label ${STATUS_CHIP[t.status] ?? STATUS_CHIP.SCHEDULED}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-body-md text-on-surface-variant">
                    {t.completed_at ? new Date(t.completed_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
