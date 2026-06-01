'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTestDraft } from '@/app/actions/scheduling';

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

interface ClassRow {
  id: string;
  name: string;
  section?: string | null;
}

interface Draft {
  id: string;
  title: string;
  instructions: string | null;
  scheduled_at: string | null;
  due_date: string | null;
  class_ids: string[];
  domain_quotas: Record<string, number>;
}

interface Props {
  draft: Draft;
  classes: ClassRow[];
  onClose: () => void;
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditDraftModal({ draft, classes, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(draft.title);
  const [instructions, setInstructions] = useState(draft.instructions ?? '');
  const [scheduledAt, setScheduledAt] = useState(toLocalDatetime(draft.scheduled_at));
  const [dueDate, setDueDate] = useState(toLocalDatetime(draft.due_date));
  const [classIds, setClassIds] = useState<Set<string>>(new Set(draft.class_ids));
  const [quotas, setQuotas] = useState<Record<QuotaDomain, number>>({
    QUANTITATIVE: draft.domain_quotas['QUANTITATIVE'] ?? 0,
    LOGICAL: draft.domain_quotas['LOGICAL'] ?? 0,
    VERBAL: draft.domain_quotas['VERBAL'] ?? 0,
    SPATIAL: draft.domain_quotas['SPATIAL'] ?? 0,
  });
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const totalQuota = useMemo(
    () => QUOTA_DOMAINS.reduce((s, d) => s + (quotas[d] || 0), 0),
    [quotas],
  );

  const quotasChanged = QUOTA_DOMAINS.some(d => quotas[d] !== (draft.domain_quotas[d] ?? 0));

  const toggleClass = (id: string) => {
    const next = new Set(classIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setClassIds(next);
  };

  const setQuota = (d: QuotaDomain, n: number) =>
    setQuotas(prev => ({ ...prev, [d]: Math.max(0, Math.min(50, Math.floor(n || 0))) }));

  const handleSave = () => {
    if (!title.trim()) { setFlash({ kind: 'err', text: 'Title is required.' }); return; }
    if (classIds.size === 0) { setFlash({ kind: 'err', text: 'Select at least one class.' }); return; }
    if (totalQuota === 0) { setFlash({ kind: 'err', text: 'Set at least one domain quota.' }); return; }

    startTransition(async () => {
      const res = await updateTestDraft(draft.id, {
        title: title.trim(),
        instructions: instructions.trim() || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        class_ids: [...classIds],
        domain_quotas: Object.fromEntries(
          QUOTA_DOMAINS.filter(d => quotas[d] > 0).map(d => [d, quotas[d]])
        ),
      });

      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="font-headline-md text-on-surface">Edit Draft Test</h2>
            <p className="font-caption text-on-surface-variant text-xs mt-0.5">
              Changing quotas will reset the attached question pool.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {flash && (
            <div className={`px-4 py-3 rounded-lg text-sm ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
              {flash.text}
            </div>
          )}

          {quotasChanged && (
            <div className="px-4 py-3 rounded-lg bg-tertiary-container/40 text-on-tertiary-container text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">warning</span>
              <span>Quota changes will clear all currently attached questions — you'll need to re-add them in Step 2.</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">
              Title <span className="text-error">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Quotas */}
          <div>
            <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-2">
              Questions per domain
            </label>
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest divide-y divide-outline-variant">
              {QUOTA_DOMAINS.map(d => (
                <div key={d} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="material-symbols-outlined text-on-surface-variant text-base">{DOMAIN_ICON[d]}</span>
                  <span className="flex-1 font-body-md text-on-surface">{DOMAIN_LABEL[d]}</span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={quotas[d]}
                    onChange={e => setQuota(d, Number(e.target.value))}
                    className="w-20 px-2 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-right focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-surface-container-low">
                <span className="material-symbols-outlined text-on-surface text-base">summarize</span>
                <span className="flex-1 font-metric-label text-on-surface">Total</span>
                <span className="font-headline-md text-on-surface">{totalQuota}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Available from</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="font-caption text-on-surface-variant mt-1 text-xs">Leave blank for immediate.</p>
            </div>
            <div>
              <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Due date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Instructions</label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={3}
              placeholder="Any notes or rules for students."
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Target classes */}
          <div>
            <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">
              Target classes <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-40 overflow-y-auto p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
              {classes.length === 0 ? (
                <span className="font-body-md text-on-surface-variant col-span-3">No classes available.</span>
              ) : classes.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={classIds.has(c.id)}
                    onChange={() => toggleClass(c.id)}
                    className="accent-primary"
                  />
                  <span className="text-on-surface">
                    {c.name}
                    {c.section && <span className="text-on-surface-variant"> · {c.section}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={pending}
            className="px-5 py-2 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {pending ? 'Saving…' : 'Save Changes'}
            <span className="material-symbols-outlined text-sm">save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
