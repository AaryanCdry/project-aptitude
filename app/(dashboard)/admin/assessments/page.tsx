import React from 'react';
import Link from 'next/link';
import { getScheduledAssessments } from '@/app/actions/admin';

function StatusBadge({ status }: { status: string }) {
  if (status === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        Active
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold uppercase tracking-wider">
        <span className="material-symbols-outlined text-[10px]">done</span>
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-outline" />
      Scheduled
    </span>
  );
}

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

// Static mini calendar for the current month
function MiniCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = now.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean }[] = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - daysInMonth - startOffset + 1, current: false });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Dot indicators on a few days (hardcoded for visual, real data would need DB)
  const dotDays = new Set([today, today + 3, today + 7].filter(d => d <= daysInMonth));

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
        <h2 className="font-headline-md text-on-surface">{monthName}</h2>
        <div className="flex gap-1">
          <button className="p-2 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="px-3 py-1 rounded border border-outline-variant font-metric-label text-metric-label hover:bg-surface-container-high transition-colors text-sm">Today</button>
          <button className="p-2 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-2 text-center font-metric-label text-on-surface-variant text-xs">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => (
              <div
                key={ci}
                className={`relative text-center p-2 rounded-lg text-sm transition-colors ${
                  !cell.current
                    ? 'text-outline-variant'
                    : cell.day === today
                    ? 'bg-primary text-on-primary font-bold shadow-sm cursor-pointer'
                    : 'hover:bg-surface-container-high cursor-pointer text-on-surface'
                }`}
              >
                {cell.day}
                {cell.current && dotDays.has(cell.day) && cell.day !== today && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-secondary block" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminAssessmentsPage() {
  const {
    totalThisWeek,
    totalCandidates,
    completionRate,
    upcoming,
    recentCompleted,
    assessmentStats,
    totalScheduled,
    totalCompleted,
  } = await getScheduledAssessments();

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="font-display-sm text-on-background mb-2">Assessment Scheduling</h1>
          <p className="font-body-md text-on-surface-variant">Manage upcoming tests and monitor session activity.</p>
        </div>
        <Link
          href="/admin/enrollment/new"
          className="bg-primary text-on-primary font-metric-label px-6 py-3 rounded-lg hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>add</span>
          Enroll New Student
        </Link>
      </div>

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
          <MiniCalendar />

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
                            {a.cohortName && <span>{a.cohortName}</span>}
                            {a.domain && <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-metric-label">{a.domain}</span>}
                            {a.dueDate && (
                              <span className="text-on-surface-variant">
                                due {formatScheduledTime(a.dueDate)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-metric-label text-on-surface text-sm">{a.completed} / {a.total}</p>
                          <p className="font-caption text-on-surface-variant text-[10px]">completed</p>
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
                      <Link href={`/admin/cohorts`} className="font-caption text-primary hover:underline text-xs">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Upcoming Tests */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col sticky top-8">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <h2 className="font-headline-md text-on-surface">Upcoming Tests</h2>
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-lg">filter_list</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
              {upcoming.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline block mb-2">event_busy</span>
                  <p className="font-body-md text-on-surface-variant">No upcoming tests.</p>
                  <p className="font-caption text-outline mt-1">Enroll students to schedule assessments.</p>
                </div>
              ) : upcoming.map(t => (
                <div
                  key={t.id}
                  className={`p-4 rounded-lg border cursor-pointer group transition-colors ${
                    t.status === 'IN_PROGRESS'
                      ? 'border-primary-fixed bg-surface-container-low hover:bg-surface-container-high'
                      : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <StatusBadge status={t.status} />
                    <span className="font-caption text-on-surface-variant group-hover:text-primary transition-colors text-xs">
                      {formatScheduledTime(t.scheduledAt)}
                    </span>
                  </div>
                  <h3 className="font-body-md font-semibold text-on-surface mb-1">{t.studentName}</h3>
                  <p className="font-caption text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">quiz</span>
                    {t.title}
                    {t.className && <span className="ml-1">· {t.className}</span>}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-bright">
              <div className="flex justify-between text-xs font-metric-label text-on-surface-variant">
                <span>{totalScheduled} active/scheduled</span>
                <span>{totalCompleted} completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
