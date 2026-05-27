import React from 'react';
import Link from 'next/link';
import { getEnrolledStudents, getEnrollmentStats } from '@/app/actions/enrollment';
import { getDepartments, getClasses } from '@/app/actions/departments';
import StudentsTable from './StudentsTable';

export default async function EnrollmentPage() {
  const [students, stats, departments, classes] = await Promise.all([
    getEnrolledStudents(),
    getEnrollmentStats(),
    getDepartments(),
    getClasses(),
  ]);

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-background mb-1">Student Enrollment</h1>
          <p className="font-body-md text-on-surface-variant">Manage new admissions and track enrollment status.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/enrollment/bulk"
            className="px-5 py-2.5 bg-surface border border-outline-variant text-on-surface rounded-lg font-metric-label hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Bulk Upload
          </Link>
          <Link
            href="/admin/enrollment/new"
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Enroll Student
          </Link>
        </div>
      </div>

      {/* Stats */}
      {(() => {
        const total = stats.totalStudents;
        const activeCount  = (students as any[]).filter(s => s.status === 'ACTIVE').length;
        const invitedCount = (students as any[]).filter(s => s.status === 'INVITED').length;
        const inactiveCount = total - activeCount - invitedCount;
        const activePct  = total > 0 ? Math.round((activeCount  / total) * 100) : 0;
        const invitedPct = total > 0 ? Math.round((invitedCount / total) * 100) : 0;
        const inactivePct = 100 - activePct - invitedPct;

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

            {/* Total Enrolled */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-t-2xl" />
              <div className="flex items-start justify-between mb-5">
                <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Total Enrolled</p>
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
                </div>
              </div>
              <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-4">{total}</p>
              {/* Proportion bar */}
              {total > 0 && (
                <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-surface-container-high">
                  <div className="h-full bg-secondary transition-all duration-700" style={{ width: `${activePct}%` }} title={`${activeCount} active`} />
                  <div className="h-full bg-outline/40 transition-all duration-700" style={{ width: `${inactivePct}%` }} title={`${inactiveCount} inactive`} />
                  <div className="h-full bg-tertiary transition-all duration-700" style={{ width: `${invitedPct}%` }} title={`${invitedCount} invited`} />
                </div>
              )}
              <p className="font-caption text-on-surface-variant text-xs mt-2">enrolled in platform</p>
            </div>

            {/* Active */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary rounded-t-2xl" />
              <div className="flex items-start justify-between mb-5">
                <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Active</p>
                <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>person_check</span>
                </div>
              </div>
              <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-3">{activeCount}</p>
              <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all duration-700" style={{ width: total > 0 ? `${activePct}%` : '0%' }} />
              </div>
              <p className="font-caption text-on-surface-variant text-xs mt-2">logged in within 7 days</p>
            </div>

            {/* Invited / Pending */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-tertiary rounded-t-2xl" />
              <div className="flex items-start justify-between mb-5">
                <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Invited</p>
                <div className="w-11 h-11 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>mark_email_unread</span>
                </div>
              </div>
              <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-3">{invitedCount}</p>
              <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-tertiary rounded-full transition-all duration-700" style={{ width: total > 0 ? `${invitedPct}%` : '0%' }} />
              </div>
              <p className="font-caption text-on-surface-variant text-xs mt-2">awaiting first login</p>
            </div>

          </div>
        );
      })()}

      <StudentsTable students={students as any} totalEnrolled={stats.totalStudents} departments={departments as any} classes={classes as any} />
    </div>
  );
}
