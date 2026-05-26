'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTestDraft } from '@/app/actions/scheduling';

interface ClassRow { id: string; name: string; year: number | null; section: string | null; dept_id: string; departments?: { name?: string } }

interface Props {
  role: string | null;
  classes: ClassRow[];
}

const QUOTA_DOMAINS = ['QUANTITATIVE', 'LOGICAL', 'VERBAL', 'SPATIAL'] as const;
type QuotaDomain = typeof QUOTA_DOMAINS[number];

const DOMAIN_LABEL: Record<QuotaDomain, string> = {
  QUANTITATIVE: 'Quantitative',
  LOGICAL: 'Logical',
  VERBAL: 'Verbal',
  SPATIAL: 'Spatial',
};

const DOMAIN_ICON: Record<QuotaDomain, string> = {
  QUANTITATIVE: 'functions',
  LOGICAL: 'psychology',
  VERBAL: 'format_quote',
  SPATIAL: 'view_in_ar',
};

export default function ScheduleFormClient({ role, classes }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [classIds, setClassIds] = useState<Set<string>>(new Set());
  const [quotas, setQuotas] = useState<Record<QuotaDomain, number>>({
    QUANTITATIVE: 0, LOGICAL: 0, VERBAL: 0, SPATIAL: 0,
  });
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const total = useMemo(
    () => QUOTA_DOMAINS.reduce((s, d) => s + (quotas[d] || 0), 0),
    [quotas],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFlash(null);
    const fd = new FormData(e.currentTarget);
    fd.set('class_ids', [...classIds].join(','));
    for (const d of QUOTA_DOMAINS) fd.set(`quota_${d}`, String(quotas[d] || 0));

    startTransition(async () => {
      const res = await createTestDraft(fd);
      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
        return;
      }
      router.push(`/schedule-test/${(res as { assessmentId: string }).assessmentId}/questions`);
    });
  };

  const toggleClass = (id: string) => {
    const next = new Set(classIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setClassIds(next);
  };

  const setQuota = (d: QuotaDomain, n: number) => {
    setQuotas((prev) => ({ ...prev, [d]: Math.max(0, Math.min(50, Math.floor(n || 0))) }));
  };

  const scopeLabel =
    role === 'MENTOR' ? 'your assigned classes'
    : role === 'SUB_ADMIN' ? 'your department'
    : 'any class in your college';

  return (
    <div>
      <div className="mb-6">
        <p className="font-metric-label text-on-surface-variant text-xs uppercase tracking-wider mb-1">Step 1 of 2</p>
        <h1 className="font-headline-md text-2xl text-on-surface">Test details</h1>
        <p className="font-body-md text-on-surface-variant mt-1">
          Configure the test for {scopeLabel}. Next, you&apos;ll author the question pool.
        </p>
      </div>

      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
          {flash.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-3xl bg-surface-container-lowest rounded-xl border border-outline-variant p-6 space-y-5">
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
          <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-2">
            Questions per domain
          </label>
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest divide-y divide-outline-variant">
            {QUOTA_DOMAINS.map((d) => (
              <div key={d} className="flex items-center gap-3 px-4 py-2.5">
                <span className="material-symbols-outlined text-on-surface-variant text-base">{DOMAIN_ICON[d]}</span>
                <span className="flex-1 font-body-md text-on-surface">{DOMAIN_LABEL[d]}</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={quotas[d]}
                  onChange={(e) => setQuota(d, Number(e.target.value))}
                  className="w-20 px-2 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-right"
                />
              </div>
            ))}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container-low">
              <span className="material-symbols-outlined text-on-surface text-base">summarize</span>
              <span className="flex-1 font-metric-label text-on-surface">Total</span>
              <span className="font-headline-md text-on-surface">{total}</span>
            </div>
          </div>
          <p className="font-caption text-on-surface-variant mt-1.5">
            Set zero for any domain you don&apos;t want to include. Total must be at least 1.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Available from (optional)</label>
            <input
              name="scheduled_at"
              type="datetime-local"
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
            />
            <p className="font-caption text-on-surface-variant mt-1">Leave blank for immediate.</p>
          </div>
          <div>
            <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Due date (optional)</label>
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
            Target classes <span className="text-error">*</span>
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
            disabled={pending || total === 0}
            className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {pending ? 'Saving…' : 'Continue to questions'}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
