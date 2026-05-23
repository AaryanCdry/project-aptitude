import React from 'react';
import Link from 'next/link';

interface CohortData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  dept?: { name: string; course_type?: string | null } | null;
  class?: { name: string; year?: number | null; section?: string | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-secondary-fixed text-on-secondary-fixed-variant border-secondary-fixed-dim',
  SCHEDULED: 'bg-surface-container text-on-surface-variant border-outline-variant',
  COMPLETED: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
};

export default function CollegeCurriculumCard({
  cohort,
  hideActions = false,
}: {
  cohort: CohortData | null;
  hideActions?: boolean;
}) {
  if (!cohort) {
    return (
      <section>
        <h4 className="font-headline-md text-on-surface mb-4">College Curriculum</h4>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm text-center">
          <span className="material-symbols-outlined text-4xl mb-2 block text-outline">school</span>
          <p className="font-body-md text-on-surface-variant">
            You haven&apos;t been assigned to a cohort yet. Contact your admin.
          </p>
        </div>
      </section>
    );
  }

  const statusStyle = STATUS_STYLES[cohort.status] ?? STATUS_STYLES.SCHEDULED;

  const metaItems = [
    cohort.dept && {
      label: 'Department',
      value: cohort.dept.name,
      sub: cohort.dept.course_type ?? null,
    },
    cohort.class && {
      label: 'Class',
      value: cohort.class.name,
      sub: cohort.class.year
        ? `Year ${cohort.class.year}${cohort.class.section ? ` · Section ${cohort.class.section}` : ''}`
        : null,
    },
    cohort.start_date && {
      label: 'Start Date',
      value: new Date(cohort.start_date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
      sub: null,
    },
    cohort.end_date && {
      label: 'End Date',
      value: new Date(cohort.end_date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
      sub: null,
    },
  ].filter(Boolean) as { label: string; value: string; sub: string | null }[];

  return (
    <section>
      <h4 className="font-headline-md text-on-surface mb-4">College Curriculum</h4>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-fixed text-on-primary-fixed p-3 rounded-xl">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <h5 className="font-headline-md text-on-surface">{cohort.name}</h5>
              {cohort.description && (
                <p className="font-caption text-on-surface-variant mt-0.5">{cohort.description}</p>
              )}
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-caption border shrink-0 ${statusStyle}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {cohort.status}
          </span>
        </div>

        {metaItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metaItems.map((item) => (
              <div key={item.label} className="bg-surface-container rounded-lg p-4">
                <p className="font-caption text-on-surface-variant mb-1">{item.label}</p>
                <p className="font-metric-label text-on-surface">{item.value}</p>
                {item.sub && (
                  <p className="font-caption text-on-surface-variant text-xs mt-0.5">{item.sub}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="font-caption text-on-surface-variant">
            {hideActions
              ? 'This student is tracked through this curriculum.'
              : 'Your college tracks your progress through this curriculum. Take tests to advance.'}
          </p>
          {!hideActions && (
            <Link
              href="/assessment"
              className="flex items-center gap-1 text-primary font-metric-label text-sm hover:underline shrink-0"
            >
              Start Test <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
