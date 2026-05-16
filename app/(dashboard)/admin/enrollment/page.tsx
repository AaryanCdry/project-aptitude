import React from 'react';
import Link from 'next/link';
import { getEnrolledStudents, getEnrollmentStats } from '@/app/actions/enrollment';
import StudentActions from './StudentActions';

const AVATAR_COLORS = [
  'bg-primary-fixed-dim text-on-primary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  'bg-secondary-fixed text-on-secondary-fixed',
];

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Total Enrolled */}
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

        {/* Active Cohorts */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>groups</span>
          </div>
          <div>
            <p className="font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider mb-0.5">Active Cohorts</p>
            <span className="font-bold text-on-background text-[32px] leading-none">{stats.cohorts.length}</span>
          </div>
        </div>

        {/* Latest Cohort */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>recent_actors</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider mb-0.5">Latest Cohort</p>
            {stats.cohorts[0] ? (
              <p className="font-semibold text-on-surface text-[15px] truncate">{stats.cohorts[0].name}</p>
            ) : (
              <p className="font-body-md text-on-surface-variant/60 italic text-sm">No cohorts yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-bright">
          <div className="flex space-x-1 border border-outline-variant rounded-lg p-1 bg-surface-container-low">
            {['All Students', 'Active', 'Invited'].map((label, i) => (
              <button
                key={label}
                className={`px-4 py-1.5 font-metric-label text-[13px] rounded-md transition-colors ${
                  i === 0
                    ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/50'
                    : 'text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-background placeholder:text-outline-variant transition-colors"
              placeholder="Search by name, email or ID…"
              type="text"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant">
                {['Student', 'Reg. ID', 'Department & Class', 'Section', 'Enrolled', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`py-3 px-4 font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider whitespace-nowrap ${i === 6 ? 'w-12' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl block mb-3 text-outline">person_off</span>
                    <p className="font-body-md">No students enrolled yet.</p>
                    <p className="font-caption text-on-surface-variant/60 mt-1">Use the buttons above to get started.</p>
                  </td>
                </tr>
              ) : students.map((student: any, idx: number) => {
                const initials = (student.name || student.email || 'U')
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();
                const ci = (student.name?.charCodeAt(0) ?? idx) % 3;

                return (
                  <tr key={student.id} className="hover:bg-surface-container/40 transition-colors group">
                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${AVATAR_COLORS[ci]}`}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[13px] text-on-background group-hover:text-primary transition-colors truncate">
                            {student.name || '—'}
                          </p>
                          <p className="text-[11px] text-on-surface-variant truncate">{student.email}</p>
                          <p className="text-[10px] text-on-surface-variant/50 font-mono">{student.platformId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Reg ID */}
                    <td className="py-3 px-4">
                      {student.registration_id ? (
                        <span className="font-mono text-[12px] text-on-surface bg-surface-container px-2 py-1 rounded-md border border-outline-variant">
                          {student.registration_id}
                        </span>
                      ) : (
                        <span className="text-outline/50 text-sm">—</span>
                      )}
                    </td>

                    {/* Department & Class */}
                    <td className="py-3 px-4">
                      {student.departmentName ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] text-on-surface font-medium">{student.departmentName}</span>
                          {student.className && (
                            <span className="text-[11px] text-on-surface-variant">{student.className}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-outline/50 text-sm">—</span>
                      )}
                    </td>

                    {/* Section */}
                    <td className="py-3 px-4">
                      {student.section ? (
                        <span className="text-[12px] font-medium text-on-surface bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-variant">
                          {student.section}
                        </span>
                      ) : (
                        <span className="text-outline/50 text-sm">—</span>
                      )}
                    </td>

                    {/* Date Enrolled */}
                    <td className="py-3 px-4 text-[12px] text-on-surface-variant whitespace-nowrap">
                      {student.dateEnrolled}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary-fixed/60 text-on-secondary-fixed-variant border border-secondary-fixed-dim">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        {student.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <StudentActions
                        studentId={student.id}
                        tempPassword={student.temp_password ?? null}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-5 py-3.5 border-t border-outline-variant bg-surface-bright flex items-center justify-between">
          <span className="text-[12px] text-on-surface-variant">
            Showing <span className="font-semibold text-on-surface">{students.length}</span> of <span className="font-semibold text-on-surface">{stats.totalStudents}</span> students
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="p-1.5 rounded-lg border border-outline-variant text-outline disabled:opacity-30 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-3 py-1 text-[12px] font-medium text-primary bg-primary/8 rounded-lg border border-primary/20">1</span>
            <button className="p-1.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
