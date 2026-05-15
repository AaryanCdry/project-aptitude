import React from 'react';
import Link from 'next/link';
import { getCohorts, getCohortStats } from '@/app/actions/cohorts';
import { getDepartments } from '@/app/actions/departments';
import CreateCohortModal from './CreateCohortModal';

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  SCHEDULED: 'bg-surface-container-high text-on-surface-variant',
  COMPLETED: 'bg-surface-container text-outline',
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
          <Link href="/admin/enrollment/bulk"
            className="px-5 py-2.5 bg-surface text-primary border border-outline-variant rounded-lg font-bold font-body-md hover:bg-surface-container-low transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined">upload</span>
            Bulk Upload
          </Link>
          <CreateCohortModal departments={deptList} />
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Active Cohorts', value: stats.activeCohorts, sub: '3 new this month', icon: 'groups', color: 'text-primary' },
          { label: 'Students Managed', value: stats.totalStudents, icon: 'school', color: 'text-secondary' },
          { label: 'Avg Completion', value: `${stats.avgCompletionRate}%`, icon: 'donut_large', color: 'text-primary', progress: stats.avgCompletionRate },
        ].map(({ label, value, sub, icon, color, progress }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full bg-surface-container flex items-center justify-center ${color}`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              </div>
              <h3 className="font-metric-label text-on-surface-variant uppercase tracking-wider text-[11px]">{label}</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-on-background">{value}</span>
              {sub && <span className="text-secondary font-body-md flex items-center gap-0.5"><span className="material-symbols-outlined text-sm">arrow_upward</span>{sub}</span>}
            </div>
            {progress != null && (
              <div className="mt-3 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ))}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {(cohorts as any[]).map((cohort: any) => (
            <div
              key={cohort.id}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.06)] transition-all flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-surface-container rounded-bl-full -z-10 group-hover:bg-primary-container/10 transition-colors" />

              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-metric-label text-[10px] uppercase tracking-wider mb-2 ${STATUS_CHIP[cohort.status] ?? STATUS_CHIP.SCHEDULED}`}>
                    {cohort.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />}
                    {cohort.status === 'SCHEDULED' && <span className="material-symbols-outlined text-[12px]">schedule</span>}
                    {cohort.status === 'COMPLETED' && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
                    {cohort.status}
                  </span>
                  <h3 className="font-headline-md text-on-background leading-tight truncate">{cohort.name}</h3>
                  {cohort.description && (
                    <p className="text-on-surface-variant font-caption mt-1 line-clamp-1">{cohort.description}</p>
                  )}
                </div>
                <button className="text-outline-variant hover:text-primary transition-colors p-1 ml-2">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>

              {/* Dept / Class breadcrumb */}
              {(cohort.dept || cohort.class) && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {cohort.dept && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-primary/8 text-primary px-2 py-0.5 rounded-full border border-primary/15">
                      <span className="material-symbols-outlined text-[12px]">account_tree</span>
                      {cohort.dept.name}
                      {cohort.dept.course_type && <span className="opacity-70">· {cohort.dept.course_type}</span>}
                    </span>
                  )}
                  {cohort.class && (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-secondary/8 text-secondary px-2 py-0.5 rounded-full border border-secondary/15">
                      <span className="material-symbols-outlined text-[12px]">meeting_room</span>
                      {cohort.class.name}
                      {cohort.class.year && <span className="opacity-70">· Yr {cohort.class.year}</span>}
                    </span>
                  )}
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <p className="font-metric-label text-outline uppercase text-[10px]">Lead Admin</p>
                  <div className="flex items-center gap-2 mt-1">
                    {cohort.admin ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-[10px] font-bold text-primary">
                          {cohort.admin.name?.[0] || 'U'}
                        </div>
                        <span className="font-body-md font-medium text-on-surface truncate">{cohort.admin.name ?? cohort.admin.email?.split('@')[0]}</span>
                      </>
                    ) : (
                      <span className="font-caption text-outline italic">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-metric-label text-outline uppercase text-[10px]">Avg Score</p>
                  <p className="font-display-sm text-[22px] text-on-surface mt-0.5 font-bold">
                    {cohort.status === 'SCHEDULED' ? '—' : `${cohort.avgPercentile}th`}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-body-md text-[13px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">group</span>
                    {cohort.studentCount} Students
                  </span>
                  <span className="font-caption text-outline">
                    {cohort.status === 'SCHEDULED' ? 'Prep Phase' : `${cohort.completionRate}% done`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full ${cohort.status === 'SCHEDULED' ? 'bg-outline-variant' : 'bg-primary'}`}
                    style={{ width: cohort.status === 'SCHEDULED' ? '5%' : `${cohort.completionRate}%` }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-outline-variant/50">
                  <Link
                    href={`/admin/cohorts/${cohort.id}`}
                    className="flex-1 py-2 bg-surface text-primary border border-outline-variant rounded-md font-body-md text-[14px] font-medium hover:bg-surface-container-low transition-colors text-center"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/admin/enrollment/new?cohort=${cohort.id}`}
                    className="flex-1 py-2 bg-primary text-on-primary rounded-md font-body-md text-[14px] font-medium hover:bg-on-primary-fixed-variant transition-colors text-center"
                  >
                    + Enroll
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
