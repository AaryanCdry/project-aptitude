'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { discardDraft } from '@/app/actions/scheduling';
import EditDraftModal from './EditDraftModal';

interface DraftRow {
  id: string;
  title: string;
  instructions: string | null;
  scheduled_at: string | null;
  due_date: string | null;
  class_ids: string[];
  class_label: string | null;
  domain_quotas: Record<string, number>;
  total_quota: number;
  attached: number;
  created_at: string;
}

interface ClassRow {
  id: string;
  name: string;
  section?: string | null;
}

interface Props {
  drafts: DraftRow[];
  classes: ClassRow[];
}

function DraftCard({ draft, classes }: { draft: DraftRow; classes: ClassRow[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [discarding, startDiscard] = useTransition();

  const progress = draft.total_quota > 0
    ? Math.round((draft.attached / draft.total_quota) * 100)
    : 0;

  const activeDomains = Object.entries(draft.domain_quotas)
    .filter(([, n]) => n > 0)
    .map(([d, n]) => `${n} ${d.charAt(0) + d.slice(1).toLowerCase()}`);

  const handleDiscard = () => {
    startDiscard(async () => {
      await discardDraft(draft.id);
      router.refresh();
    });
  };

  return (
    <>
      <div className="p-4 hover:bg-surface-container transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-metric-label px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">
                <span className="material-symbols-outlined text-[10px]">edit_document</span>
                DRAFT
              </span>
              <p className="font-body-md font-semibold text-on-surface truncate">{draft.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-caption text-on-surface-variant text-xs">
              {draft.class_label && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">class</span>
                  {draft.class_label}
                </span>
              )}
              {activeDomains.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">quiz</span>
                  {activeDomains.join(' · ')}
                </span>
              )}
              {draft.due_date && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  due {new Date(draft.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              title="Edit draft details"
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>

            {!confirmDiscard ? (
              <button
                onClick={() => setConfirmDiscard(true)}
                title="Discard draft"
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDiscard}
                  disabled={discarding}
                  className="px-2.5 py-1 rounded-lg bg-error text-on-error text-xs font-metric-label hover:bg-error/90 transition-colors disabled:opacity-50"
                >
                  {discarding ? 'Deleting…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDiscard(false)}
                  className="px-2 py-1 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-metric-label hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            <Link
              href={`/schedule-test/${draft.id}/questions`}
              className="ml-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-metric-label hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              Continue
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Question progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-secondary' : 'bg-primary/60'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-caption text-on-surface-variant text-[10px] tabular-nums shrink-0">
            {draft.attached} / {draft.total_quota} questions
          </span>
        </div>
      </div>

      {editOpen && (
        <EditDraftModal
          draft={draft}
          classes={classes}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

export default function DraftTestsSection({ drafts, classes }: Props) {
  if (drafts.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary text-lg">edit_document</span>
          <h2 className="font-headline-md text-on-surface">Draft Tests</h2>
          <span className="ml-1 text-xs font-metric-label px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">
            {drafts.length}
          </span>
        </div>
        <p className="font-caption text-on-surface-variant text-xs">Not yet visible to students</p>
      </div>
      <div className="divide-y divide-outline-variant">
        {drafts.map(d => (
          <DraftCard key={d.id} draft={d} classes={classes} />
        ))}
      </div>
    </div>
  );
}
