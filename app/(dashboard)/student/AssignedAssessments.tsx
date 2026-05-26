import React from 'react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  domain: string | null;
  instructions: string | null;
  due_date: string | null;
  scheduled_at: string | null;
  className: string;
  isOverdue: boolean;
  isOpenable: boolean;
  testId: string | null;
  testStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | null;
}

const DOMAIN_ICONS: Record<string, string> = {
  QUANTITATIVE: 'functions',
  LOGICAL: 'psychology',
  VERBAL: 'format_quote',
  REASONING: 'visibility',
  SPATIAL: 'view_in_ar',
};

function formatDue(dateStr: string | null): string {
  if (!dateStr) return 'No deadline';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function formatOpensIn(dateStr: string): string {
  const d = new Date(dateStr);
  const diffMs = d.getTime() - Date.now();
  if (diffMs <= 0) return 'Available now';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `Opens in ${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `Opens in ${diffHr}h`;
  const diffDays = Math.round(diffHr / 24);
  return `Opens in ${diffDays}d`;
}

export default function AssignedAssessments({ assignments }: { assignments: Assignment[] }) {
  if (assignments.length === 0) return null;

  const completed = assignments.filter((a) => a.testStatus === 'COMPLETED');
  const pending = assignments.filter((a) => a.testStatus !== 'COMPLETED');

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-headline-md text-on-surface">Assigned by College</h4>
          <p className="font-caption text-on-surface-variant mt-0.5">
            Tests your college has scheduled for you.
          </p>
        </div>
        {pending.length > 0 && (
          <span className="bg-error-container text-on-error-container font-caption px-3 py-1 rounded-full text-xs">
            {pending.length} pending
          </span>
        )}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {pending.map((a, i) => {
          const icon = a.domain ? (DOMAIN_ICONS[a.domain] ?? 'quiz') : 'quiz';
          const domainLabel = a.domain
            ? a.domain.charAt(0) + a.domain.slice(1).toLowerCase()
            : 'Mixed';
          const dueLabel = formatDue(a.due_date);
          const isOverdue = a.isOverdue;
          const isInProgress = a.testStatus === 'IN_PROGRESS';
          const startable = !!a.testId && a.isOpenable && !isOverdue;
          const startHref = a.testId ? `/assessment?test=${a.testId}` : '/assessment';

          return (
            <div
              key={a.id}
              className={`flex items-center gap-4 px-5 py-4 ${i < pending.length - 1 || completed.length > 0 ? 'border-b border-outline-variant' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOverdue ? 'bg-error-container text-error' : 'bg-primary-fixed text-on-primary-fixed'}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-metric-label text-on-surface truncate">{a.title}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="font-caption text-on-surface-variant text-xs">{domainLabel}</span>
                  <span className={`font-caption text-xs font-medium ${isOverdue ? 'text-error' : 'text-secondary'}`}>
                    {dueLabel}
                  </span>
                  {!a.isOpenable && a.scheduled_at && (
                    <span className="font-caption text-xs font-medium text-on-surface-variant">
                      {formatOpensIn(a.scheduled_at)}
                    </span>
                  )}
                  {isInProgress && (
                    <span className="font-caption text-xs font-medium text-primary">
                      In progress
                    </span>
                  )}
                </div>
                {a.instructions && (
                  <p className="font-caption text-on-surface-variant text-[11px] mt-0.5 line-clamp-1 italic">
                    {a.instructions}
                  </p>
                )}
              </div>
              {isOverdue ? (
                <span className="shrink-0 px-4 py-2 bg-error-container text-on-error-container font-metric-label text-sm rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Closed
                </span>
              ) : startable ? (
                <Link
                  href={startHref}
                  className="shrink-0 px-4 py-2 bg-primary text-on-primary font-metric-label text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  {isInProgress ? 'Resume' : 'Start'}
                </Link>
              ) : (
                <span className="shrink-0 px-4 py-2 bg-surface-container text-on-surface-variant font-metric-label text-sm rounded-lg flex items-center gap-1 cursor-not-allowed">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  Not yet open
                </span>
              )}
            </div>
          );
        })}

        {completed.map((a, i) => {
          const icon = a.domain ? (DOMAIN_ICONS[a.domain] ?? 'quiz') : 'quiz';
          const domainLabel = a.domain
            ? a.domain.charAt(0) + a.domain.slice(1).toLowerCase()
            : 'Mixed';
          return (
            <div
              key={a.id}
              className={`flex items-center gap-4 px-5 py-4 opacity-80 ${i < completed.length - 1 ? 'border-b border-outline-variant' : ''}`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-secondary-fixed text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-metric-label text-on-surface truncate">{a.title}</p>
                <span className="font-caption text-on-surface-variant text-xs">{domainLabel}</span>
              </div>
              {a.testId ? (
                <Link
                  href={`/student/results/${a.testId}`}
                  className="shrink-0 flex items-center gap-1 px-4 py-2 border border-outline text-on-surface font-metric-label text-sm rounded-lg hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">analytics</span>
                  Review
                </Link>
              ) : (
                <span className="shrink-0 flex items-center gap-1 text-secondary font-metric-label text-sm">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Done
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
