import React from 'react';
import { getAdminDashboardData } from '@/app/actions/dashboard';
import { getCallerScope } from '@/app/actions/scope';

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

  // Max bar height = 200px; scale bars relative to the highest weekly avg
  const maxAvg = Math.max(...weeklyTrend.map(w => w.average), 1);

  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────── */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-surface">{overviewTitle}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">{overviewSubtitle}</p>
        </div>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-metric-label text-metric-label hover:bg-primary-fixed-variant transition-colors flex items-center space-x-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>download</span>
          <span>Export Report</span>
        </button>
      </header>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
            </div>
            <p className="font-metric-label text-metric-label text-on-surface-variant uppercase">Total Students</p>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="font-display-lg text-display-lg text-primary">{totalStudents}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>analytics</span>
            </div>
            <p className="font-metric-label text-metric-label text-on-surface-variant uppercase">Average Score</p>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="font-display-lg text-display-lg text-primary">{averageScore}%</span>
            <span className="font-caption text-caption text-on-surface-variant">{avgScopeLabel}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>task_alt</span>
            </div>
            <p className="font-metric-label text-metric-label text-on-surface-variant uppercase">Tests Completed</p>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="font-display-lg text-display-lg text-primary">{totalCompletedTests}</span>
            <span className="font-caption text-caption text-on-surface-variant">all time</span>
          </div>
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
            <div className="h-64 relative flex items-end justify-around px-4 pb-8 border-b border-l border-outline-variant gap-4">
              {/* Grid lines */}
              <div className="absolute w-full border-t border-outline-variant/30 bottom-1/4 left-0"></div>
              <div className="absolute w-full border-t border-outline-variant/30 bottom-2/4 left-0"></div>
              <div className="absolute w-full border-t border-outline-variant/30 bottom-3/4 left-0"></div>

              {weeklyTrend.map((week, i) => {
                const pct = maxAvg > 0 ? (week.average / 100) * 100 : 0; // percentage of chart height
                const barH = maxAvg > 0 ? `${Math.round((week.average / maxAvg) * 160)}px` : '4px';
                const isLatest = i === weeklyTrend.length - 1;
                return (
                  <div key={week.label} className="flex-1 flex flex-col items-center justify-end relative group">
                    {/* Tooltip */}
                    <div className="absolute -top-7 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {week.average > 0 ? `${week.average}%` : 'No data'}
                    </div>
                    {/* Pale background bar */}
                    <div className="w-full bg-primary/10 rounded-t-sm absolute bottom-0" style={{ height: barH }}></div>
                    {/* Filled bar */}
                    <div
                      className={`w-full rounded-t-sm z-10 relative transition-all duration-500 ${isLatest ? 'bg-secondary' : 'bg-primary'}`}
                      style={{ height: week.average > 0 ? `${Math.round((week.average / maxAvg) * 100)}px` : '2px' }}
                    ></div>
                    {/* X-axis label */}
                    <span className="absolute -bottom-6 text-caption text-on-surface-variant">
                      {week.label === 'W4' ? 'This Wk' : week.label === 'W0' ? '4w ago' : week.label}
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
