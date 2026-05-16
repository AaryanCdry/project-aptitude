'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCohortAssessment } from '@/app/actions/cohorts';

export default function DeleteAssessmentButton({
  assessmentId,
  cohortId,
}: {
  assessmentId: string;
  cohortId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm('Remove this scheduled assessment?')) return;
    startTransition(async () => {
      await deleteCohortAssessment(assessmentId, cohortId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-outline hover:text-error transition-colors rounded hover:bg-error-container/30 disabled:opacity-40"
      title="Remove"
    >
      <span className="material-symbols-outlined text-[18px]">
        {isPending ? 'hourglass_empty' : 'delete'}
      </span>
    </button>
  );
}
