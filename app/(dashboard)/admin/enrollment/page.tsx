import React from 'react';
import Link from 'next/link';
import { getEnrolledStudents, getEnrollmentStats } from '@/app/actions/enrollment';
import StudentsTable from './StudentsTable';

export default async function EnrollmentPage() {
  const [students, stats] = await Promise.all([
    getEnrolledStudents(),
    getEnrollmentStats(),
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
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5 mb-8 max-w-xs">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
          </div>
          <div>
            <p className="font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider mb-0.5">Total Enrolled</p>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-on-background text-[32px] leading-none">{stats.totalStudents}</span>
              <span className="font-caption text-secondary text-[11px] flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
                active
              </span>
            </div>
          </div>
        </div>
      </div>

      <StudentsTable students={students as any} totalEnrolled={stats.totalStudents} />
    </div>
  );
}
