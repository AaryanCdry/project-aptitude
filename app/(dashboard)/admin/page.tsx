import React from 'react';
import { getAdminDashboardData } from '@/app/actions/dashboard';
import { getCallerScope } from '@/app/actions/scope';
import ExportButton from './_shared/ExportButton';

export default async function AdminDashboard() {
  const [{
    totalStudents,
    totalCompletedTests,
    averageScore,
    domainAverages,
    studentsAtRisk,
    topPerformers,
    weeklyTrend,
  }, scope] = await Promise.all([getAdminDashboardData(), getCallerScope()]);

  // Page-header copy tracks the caller's actual remit: a HOD's view is
  // department-scoped, while a Principal sees the whole college.
  const isHOD = scope.role === 'SUB_ADMIN';
  const overviewTitle = isHOD ? 'Department Overview' : 'College Overview';
  const overviewSubtitle = isHOD ? 'Department Assessment Cycle' : 'Platform Assessment Cycle';
  const avgScopeLabel = isHOD ? 'department-wide' : 'college-wide';


  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-surface">{overviewTitle}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">{overviewSubtitle}</p>
        </div>
        <ExportButton />
      </header>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total Students */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-t-2xl" />
          <div className="flex items-start justify-between mb-5">
            <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Total Students</p>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
            </div>
          </div>
          <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-2">{totalStudents}</p>
          <p className="font-caption text-on-surface-variant text-xs">enrolled in platform</p>
        </div>

        {/* Average Score */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary rounded-t-2xl" />
          <div className="flex items-start justify-between mb-5">
            <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Average Score</p>
            <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>analytics</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none">{averageScore}</p>
            <span className="font-headline-md text-on-surface-variant text-2xl font-semibold">%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full transition-all duration-700" style={{ width: `${Math.min(100, averageScore)}%` }} />
          </div>
          <p className="font-caption text-on-surface-variant text-xs mt-2">{avgScopeLabel}</p>
        </div>

        {/* Tests Completed */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-tertiary rounded-t-2xl" />
          <div className="flex items-start justify-between mb-5">
            <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Tests Completed</p>
            <div className="w-11 h-11 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>task_alt</span>
            </div>
          </div>
          <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-2">{totalCompletedTests}</p>
          <p className="font-caption text-on-surface-variant text-xs">all time</p>
        </div>
      </div>

      {/* ── Charts Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* Weekly Performance Trend — dynamic bars */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Performance Trends</h2>
            <span className="font-caption text-caption text-on-surface-variant bg-surface-container px-2 py-1 rounded">Last 5 Weeks</span>
          </div>

          {weeklyTrend.every(w => w.average === 0) ? (
            <div className="h-64 flex items-center justify-center text-on-surface-variant font-body-md">
              No score data available yet.
            </div>
          ) : (
            <div className="h-52 relative flex items-end justify-around px-2 pb-8 border-b border-l border-outline-variant gap-3">
              {/* Y-axis grid lines at 25%, 50%, 75% */}
              {[25, 50, 75].map(pct => (
                <div key={pct} className="absolute w-full border-t border-outline-variant/30 left-0 pointer-events-none" style={{ bottom: `calc(${pct * 1.6}px + 2rem)` }}>
                  <span className="absolute -left-7 -translate-y-1/2 text-[9px] text-on-surface-variant/50 tabular-nums">{pct}</span>
                </div>
              ))}

              {weeklyTrend.map((week, i) => {
                const barH = Math.round((week.average / 100) * 160);
                const isLatest = i === weeklyTrend.length - 1;
                const hasData = week.average > 0;
                const xLabel = week.label === 'W4' ? 'This Wk' : week.label === 'W0' ? '4w ago' : week.label;
                return (
                  <div key={week.label} className="flex-1 flex flex-col items-center justify-end relative group h-full">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-inverse-surface text-inverse-on-surface text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 font-metric-label">
                      {hasData ? `${week.average}%` : 'No data'}
                    </div>
                    {/* Ghost bar — always full 160px ceiling, very faint */}
                    <div className="w-full bg-primary/8 rounded-t absolute bottom-0" style={{ height: '160px' }} />
                    {/* Filled bar */}
                    {hasData ? (
                      <div
                        className={`w-full rounded-t z-10 relative transition-all duration-700 ease-out ${isLatest ? 'bg-secondary' : 'bg-primary/70'}`}
                        style={{ height: `${barH}px` }}
                      />
                    ) : (
                      <div className="w-full border-t-2 border-dashed border-outline-variant/40 z-10 relative" style={{ height: '2px' }} />
                    )}
                    {/* X-axis label */}
                    <span className={`absolute -bottom-6 text-[11px] font-caption whitespace-nowrap ${isLatest ? 'text-secondary font-semibold' : 'text-on-surface-variant'}`}>
                      {xLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cognitive Distribution */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Cognitive Distribution</h2>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {domainAverages?.length ? domainAverages.map((domain, idx) => {
              const bgColors = ['bg-primary', 'bg-secondary', 'bg-primary/60', 'bg-secondary/60'];
              const colorClass = bgColors[idx % bgColors.length];
              return (
                <div key={domain.domain}>
                  <div className="flex justify-between mb-2">
                    <span className="font-metric-label text-metric-label text-on-surface capitalize">
                      {domain.domain.charAt(0) + domain.domain.slice(1).toLowerCase()}
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">{domain.average}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass}`} style={{ width: `${Math.min(100, Math.max(0, domain.average))}%` }}></div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-on-surface-variant text-body-md">No domain data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Students At Risk + Top Performers ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Students At Risk */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Students at Risk</h2>
          <div className="space-y-4">
            {studentsAtRisk?.length ? studentsAtRisk.map((student) => {
              const initials = student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div key={student.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-outline-variant/50 hover:border-error/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold font-metric-label">{initials}</div>
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-on-surface">{student.name}</p>
                      <p className="font-caption text-caption text-error flex items-center">
                        <span className="material-symbols-outlined text-[14px] mr-1">trending_down</span>
                        Avg: {student.average}%
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">visibility</span></button>
                    <button className="p-2 text-on-surface-variant hover:text-secondary transition-colors"><span className="material-symbols-outlined">send</span></button>
                  </div>
                </div>
              );
            }) : (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-secondary mb-2 block">check_circle</span>
                <p className="text-on-surface-variant text-body-md">No at-risk students — great performance across the board!</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Top Performing Students</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Rank</th>
                  <th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Student</th>
                  <th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Avg Score</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {topPerformers?.length ? topPerformers.map((student, idx) => {
                  const rankColors = ['text-tertiary-container', 'text-outline', 'text-on-surface-variant'];
                  const rankIcons = ['emoji_events', 'military_tech', 'workspace_premium'];
                  return (
                    <tr key={student.id} className="border-b border-outline-variant/50 hover:bg-surface-container/50 transition-colors">
                      <td className="py-4">
                        <span className={`material-symbols-outlined ${rankColors[idx] || 'text-on-surface-variant'}`} style={{ fontVariationSettings: '"FILL" 1' }}>
                          {rankIcons[idx] || 'star'}
                        </span>
                      </td>
                      <td className="py-4 font-semibold">{student.name}</td>
                      <td className="py-4 text-primary font-bold">{student.average}%</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-on-surface-variant">
                      No performance data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
