import React from 'react';
import Link from 'next/link';
import { getCohorts, getCohortStats } from '@/app/actions/cohorts';
import { getDepartments } from '@/app/actions/departments';
import CreateCohortModal from './CreateCohortModal';

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: 'bg-secondary-fixed/60 text-on-secondary-fixed-variant border border-secondary-fixed-dim',
  SCHEDULED: 'bg-surface-container text-on-surface-variant border border-outline-variant',
  COMPLETED: 'bg-surface-container-high text-on-surface border border-outline-variant',
};

const STATUS_BAR: Record<string, string> = {
  ACTIVE: 'bg-secondary',
  SCHEDULED: 'bg-outline-variant',
  COMPLETED: 'bg-primary',
};

export default async function CohortsPage() {
  const [cohorts, stats, departments] = await Promise.all([
    getCohorts(),
    getCohortStats(),
    getDepartments(),
  ]);

  const deptList = (departments as any[]).map((d: any) => ({
    id: d.id,
    name: d.name,
    course_type: d.course_type ?? '',
  }));

  return (
    <div className="max-w-container-max-width mx-auto mb-10 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-background mb-2">Cohort Management</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Oversee learning groups linked to departments & classes.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/enrollment/bulk"
            className="px-5 py-2.5 bg-surface text-primary border border-outline-variant rounded-lg font-metric-label hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Bulk Upload
          </Link>
          <CreateCohortModal departments={deptList} />
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>groups</span>
          </div>
          <div className="min-w-0">
            <p className="font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider mb-0.5">Active Cohorts</p>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-on-background text-[32px] leading-none">{stats.activeCohorts}</span>
              {stats.newThisMonth > 0 && (
                <span className="text-secondary font-caption flex items-center gap-0.5 text-[11px]">
                  <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                  {stats.newThisMonth} new
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>school</span>
          </div>
          <div className="min-w-0">
            <p className="font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider mb-0.5">Students Managed</p>
            <span className="font-bold text-on-background text-[32px] leading-none">{stats.totalStudents}</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>donut_large</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider mb-0.5">Avg Completion</p>
            <div className="flex items-baseline gap-3">
              <span className="font-bold text-on-background text-[32px] leading-none">{stats.avgCompletionRate}%</span>
            </div>
            <div className="mt-2 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-tertiary rounded-full transition-all" style={{ width: `${stats.avgCompletionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Cohort Grid */}
      {cohorts.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline block mb-3">group_work</span>
          <p className="font-headline-md text-on-surface mb-2">No cohorts yet</p>
          <p className="font-body-md text-on-surface-variant mb-6">
            Create your first cohort and link it to a department & class.
          </p>
          <CreateCohortModal departments={deptList} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {(cohorts as any[]).map((cohort: any) => {
            const hasStudents = cohort.studentCount > 0;
            const isScheduled = cohort.status === 'SCHEDULED';
            const completionWidth = !hasStudents || isScheduled ? 0 : cohort.completionRate;

            return (
              <div
                key={cohort.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm hover:shadow-md hover:border-outline transition-all flex flex-col group overflow-hidden"
              >
                {/* Status accent strip */}
                <div className={`h-[3px] w-full ${STATUS_BAR[cohort.status] ?? 'bg-outline-variant'}`} />

                <div className="p-5 flex flex-col flex-1 gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-metric-label text-[10px] uppercase tracking-wider ${STATUS_CHIP[cohort.status] ?? STATUS_CHIP.SCHEDULED}`}>
                          {cohort.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                          {cohort.status === 'SCHEDULED' && <span className="material-symbols-outlined text-[10px]">schedule</span>}
                          {cohort.status === 'COMPLETED' && <span className="material-symbols-outlined text-[10px]">check_circle</span>}
                          {cohort.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-on-background text-[16px] leading-snug truncate">{cohort.name}</h3>
                      {cohort.description && (
                        <p className="text-on-surface-variant text-[12px] mt-0.5 line-clamp-1">{cohort.description}</p>
                      )}
                    </div>
                    <Link
                      href={`/admin/cohorts/${cohort.id}`}
                      className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors shrink-0 mt-0.5"
                      title="Open detail"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </Link>
                  </div>

                  {/* Dept / Class tags */}
                  {(cohort.dept || cohort.class) && (
                    <div className="flex items-center gap-1.5 flex-wrap -mt-1">
                      {cohort.dept && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-primary/8 text-primary px-2 py-0.5 rounded-full border border-primary/15 font-medium">
                          <span className="material-symbols-outlined text-[11px]">account_tree</span>
                          {cohort.dept.name}
                          {cohort.dept.course_type && <span className="opacity-60">· {cohort.dept.course_type}</span>}
                        </span>
                      )}
                      {cohort.class && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-secondary/8 text-secondary px-2 py-0.5 rounded-full border border-secondary/15 font-medium">
                          <span className="material-symbols-outlined text-[11px]">meeting_room</span>
                          {cohort.class.name}{cohort.class.year ? ` · Yr ${cohort.class.year}` : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 3-stat strip */}
                  <div className="grid grid-cols-3 divide-x divide-outline-variant bg-surface-container rounded-xl overflow-hidden">
                    <div className="flex flex-col items-center py-3 px-2">
                      <span className="text-[11px] font-metric-label text-on-surface-variant mb-1">Students</span>
                      <span className="font-bold text-on-surface text-[20px] leading-none">{cohort.studentCount}</span>
                    </div>
                    <div className="flex flex-col items-center py-3 px-2">
                      <span className="text-[11px] font-metric-label text-on-surface-variant mb-1">Avg Score</span>
                      <span className={`font-bold text-[20px] leading-none ${cohort.avgPercentile > 0 ? 'text-secondary' : 'text-outline'}`}>
                        {cohort.avgPercentile > 0 ? `${cohort.avgPercentile}%` : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center py-3 px-2">
                      <span className="text-[11px] font-metric-label text-on-surface-variant mb-1">Done</span>
                      <span className={`font-bold text-[20px] leading-none ${cohort.completionRate > 0 && hasStudents ? 'text-primary' : 'text-outline'}`}>
                        {!hasStudents || isScheduled ? '—' : `${cohort.completionRate}%`}
                      </span>
                    </div>
                  </div>

                  {/* Progress + admin row */}
                  <div className="mt-auto">
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${STATUS_BAR[cohort.status] ?? 'bg-outline-variant'}`}
                        style={{ width: `${completionWidth}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      {cohort.admin ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                            {cohort.admin.name?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                          <span className="text-[11px] text-on-surface-variant truncate max-w-[120px]">
                            {cohort.admin.name ?? cohort.admin.email?.split('@')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-outline italic">No admin</span>
                      )}
                      <span className="text-[11px] text-on-surface-variant">
                        {!hasStudents ? 'No students yet' : isScheduled ? 'Not started' : cohort.completionRate > 0 ? `${cohort.completionRate}% done` : 'No tests yet'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-outline-variant/50">
                    <Link
                      href={`/admin/cohorts/${cohort.id}`}
                      className="flex-1 py-2 text-center bg-surface-container text-on-surface border border-outline-variant rounded-lg font-metric-label text-[13px] hover:bg-surface-container-high transition-colors"
                    >
                      Manage
                    </Link>
                    <Link
                      href={`/admin/enrollment/new?cohort=${cohort.id}`}
                      className="flex-1 py-2 text-center bg-primary text-on-primary rounded-lg font-metric-label text-[13px] hover:bg-primary/90 transition-colors"
                    >
                      + Enroll
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
