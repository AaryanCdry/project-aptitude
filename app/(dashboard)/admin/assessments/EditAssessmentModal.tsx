'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateActiveAssessment } from '@/app/actions/scheduling';

interface Props {
  assessment: {
    id: string;
    title: string;
    instructions: string | null;
    scheduledAt: string | null;
    dueDate: string | null;
  };
  onClose: () => void;
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditAssessmentModal({ assessment, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(assessment.title);
  const [instructions, setInstructions] = useState(assessment.instructions ?? '');
  const [scheduledAt, setScheduledAt] = useState(toLocalDatetime(assessment.scheduledAt));
  const [dueDate, setDueDate] = useState(toLocalDatetime(assessment.dueDate));
  const [flash, setFlash] = useState<string | null>(null);

  const handleSave = () => {
    if (!title.trim()) { setFlash('Title is required.'); return; }

    startTransition(async () => {
      const res = await updateActiveAssessment(assessment.id, {
        title: title.trim(),
        instructions: instructions.trim() || null,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });

      if ('error' in res && res.error) {
        setFlash(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="font-headline-md text-on-surface">Edit Assessment</h2>
            <p className="font-caption text-on-surface-variant text-xs mt-0.5">
              Questions and enrolled students are not affected.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {flash && (
            <div className="px-4 py-3 rounded-lg bg-error-container text-on-error-container text-sm">
              {flash}
            </div>
          )}

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-metric-label text-on-surface text-xs uppercase tracking-wider block mb-1.5">Available from</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
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

          <p className="font-caption text-on-surface-variant text-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Changing dates affects when students can access the test. Questions and enrolled students cannot be changed on a live assessment.
          </p>
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
