'use client';

import { useState } from 'react';
import EditAssessmentModal from './EditAssessmentModal';

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
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setEditOpen(true)}
        title="Edit assessment"
        className="p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">edit</span>
      </button>

      {editOpen && (
        <EditAssessmentModal
          assessment={assessment}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
