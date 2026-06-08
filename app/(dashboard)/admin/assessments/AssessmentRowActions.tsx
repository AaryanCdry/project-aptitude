'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import EditAssessmentModal from './EditAssessmentModal';
import { deleteScheduledAssessment } from '@/app/actions/scheduling';

interface Props {
  assessment: {
    id: string;
    title: string;
    instructions: string | null;
    scheduledAt: string | null;
    dueDate: string | null;
  };
}

export default function AssessmentRowActions({ assessment }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function handleDelete() {
    setDeleteError(null);
    startDelete(async () => {
      const res = await deleteScheduledAssessment(assessment.id);
      if ('error' in res) {
        setDeleteError(res.error ?? null);
        setConfirmDelete(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditOpen(true)}
          title="Edit assessment"
          className="p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>

        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
              className="px-2 py-1 text-[11px] border border-outline-variant rounded-lg font-metric-label text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-2 py-1 text-[11px] bg-error text-on-error rounded-lg font-metric-label hover:bg-error/90 disabled:opacity-50 flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[12px]">
                {isDeleting ? 'hourglass_empty' : 'delete'}
              </span>
              {isDeleting ? '…' : 'Confirm'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setConfirmDelete(true); setDeleteError(null); }}
            title="Delete assessment"
            className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        )}
      </div>

      {deleteError && (
        <p className="text-error text-[11px] mt-1 max-w-48 text-right leading-tight">{deleteError}</p>
      )}

      {editOpen && (
        <EditAssessmentModal
          assessment={assessment}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
