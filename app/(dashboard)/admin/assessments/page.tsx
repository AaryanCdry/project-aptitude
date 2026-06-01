import React from 'react';
import Link from 'next/link';
import { getScheduledAssessments } from '@/app/actions/admin';
import { getDraftAssessments } from '@/app/actions/scheduling';
import { getCallerScope, resolveAllowedClassIds } from '@/app/actions/scope';
import { createAdminClient } from '@/lib/supabase/admin';
import UpcomingTestsPanel from './UpcomingTestsPanel';
import MiniCalendar from './MiniCalendar';
import DraftTestsSection from './DraftTestsSection';
import AssessmentRowActions from './AssessmentRowActions';


function formatScheduledTime(scheduledAt: string | null): string {
  if (!scheduledAt) return '—';
  const d = new Date(scheduledAt);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const daysDiff = Math.round(diff / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  if (daysDiff === 1) return `Tomorrow, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  if (daysDiff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default async function AdminAssessmentsPage() {
  const [
    { totalThisWeek, totalCandidates, completionRate, recentCompleted, assessmentStats, totalScheduled, totalCompleted },
    drafts,
    scope,
  ] = await Promise.all([
    getScheduledAssessments(),
    getDraftAssessments(),
    getCallerScope(),
  ]);

  // Fetch classes scoped to this caller for the Edit modal
  const allowedClassIds = await resolveAllowedClassIds(scope);
  const adminClient = createAdminClient();
  let classesQ = adminClient
    .from('classes')
    .select('id, name, section')
    .order('name');
  if (allowedClassIds !== null && allowedClassIds.length > 0) {
    classesQ = classesQ.in('id', allowedClassIds);
  } else if (allowedClassIds !== null && allowedClassIds.length === 0) {
    classesQ = classesQ.in('id', ['__none__']);
  }
  const { data: classRows } = await classesQ;
  const classes = (classRows ?? []) as { id: string; name: string; section: string | null }[];

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="font-display-sm text-on-background mb-2">Assessment Scheduling</h1>
          <p className="font-body-md text-on-surface-variant">Manage upcoming tests and monitor session activity.</p>
        </div>
        <Link
          href="/schedule-test"
          className="bg-primary text-on-primary font-metric-label px-6 py-3 rounded-lg hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>add</span>
          Schedule New Test
        </Link>
      </div>

      {/* Draft Tests */}
      <DraftTestsSection drafts={drafts as any} classes={classes} />

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left: Calendar + Stats */}
        <div className="lg:col-span-2 flex flex-col gap-gutter">

          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary bg-primary-fixed p-2 rounded-lg">event_available</span>
                <span className="font-metric-label text-secondary text-xs">This Week</span>
              </div>
              <div className="font-display-sm text-on-surface">{totalThisWeek}</div>
              <div className="font-caption text-on-surface-variant mt-1">Scheduled Tests</div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-secondary bg-secondary-fixed p-2 rounded-lg">group</span>
                <span className="font-metric-label text-secondary text-xs">Candidates</span>
              </div>
              <div className="font-display-sm text-on-surface">{totalCandidates}</div>
              <div className="font-caption text-on-surface-variant mt-1">Registered</div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-tertiary bg-tertiary-fixed p-2 rounded-lg">check_circle</span>
                <span className="font-metric-label text-secondary text-xs">Completion</span>
              </div>
              <div className="font-display-sm text-on-surface">{completionRate}%</div>
              <div className="font-caption text-on-surface-variant mt-1">Avg. Success Rate</div>
            </div>
          </div>

          {/* Calendar */}
          <MiniCalendar scheduledDates={assessmentStats.flatMap(a => [a.scheduledAt, a.dueDate])} />

          {/* Scheduled assessments — per-assessment progress */}
          {assessmentStats.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
                <h2 className="font-headline-md text-on-surface">Scheduled Assessments</h2>
                <Link href="/schedule-test" className="font-metric-label text-sm text-primary hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">add</span>
                  Schedule new
                </Link>
              </div>
              <div className="divide-y divide-outline-variant">
                {assessmentStats.slice(0, 8).map(a => {
                  const pct = a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0;
                  const isDone = a.completed === a.total && a.total > 0;
                  return (
                    <div key={a.id} className="p-4 hover:bg-surface-container transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-body-md font-semibold text-on-surface truncate">{a.title}</p>
                          <p className="font-caption text-on-surface-variant flex items-center gap-2 flex-wrap mt-0.5">
                            {a.classLabel && <span>{a.classLabel}</span>}
                            {a.domain && <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-metric-label">{a.domain}</span>}
                            {a.dueDate && (
                              <span className="text-on-surface-variant">
                                due {formatScheduledTime(a.dueDate)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="font-metric-label text-on-surface text-sm">{a.completed} / {a.total}</p>
                            <p className="font-caption text-on-surface-variant text-[10px]">completed</p>
                          </div>
                          <AssessmentRowActions assessment={{
                            id: a.id,
                            title: a.title,
                            instructions: a.instructions,
                            scheduledAt: a.scheduledAt,
                            dueDate: a.dueDate,
                          }} />
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isDone ? 'bg-secondary' : 'bg-primary'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {a.inProgress > 0 && (
                        <p className="font-caption text-on-surface-variant text-[10px] mt-1">
                          {a.inProgress} in progress
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent completions */}
          {recentCompleted.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright">
                <h2 className="font-headline-md text-on-surface">Recently Completed</h2>
              </div>
              <div className="divide-y divide-outline-variant">
                {recentCompleted.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-surface-container transition-colors opacity-80 hover:opacity-100">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-xl">task_alt</span>
                      <div>
                        <p className="font-body-md font-semibold text-on-surface">{t.studentName}</p>
                        <p className="font-caption text-on-surface-variant">{t.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-caption text-on-surface-variant">
                        {t.completedAt
                          ? new Date(t.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </p>
                      <Link href={`/admin/results/${t.id}`} className="font-caption text-primary hover:underline text-xs">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Upcoming Tests */}
        <div className="lg:col-span-1">
          <UpcomingTestsPanel assessments={assessmentStats} />
        </div>
      </div>
    </>
  );
}
