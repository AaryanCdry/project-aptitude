import React from 'react';
import Link from 'next/link';
import { getEnrolledStudents, getEnrollmentStats } from '@/app/actions/enrollment';

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
          <h1 className="font-display-sm text-display-sm text-on-background mb-2">Student Enrollment</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage new admissions and track enrollment status.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/enrollment/bulk" className="px-6 py-3 bg-surface-container-lowest text-on-background border border-outline-variant rounded-lg font-metric-label hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">upload_file</span>
            Bulk Upload
          </Link>
          <Link href="/admin/enrollment/new" className="px-6 py-3 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">add</span>
            Enroll New Student
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full translate-x-4 -translate-y-4" />
          <h3 className="font-metric-label text-on-surface-variant mb-2">Total Enrolled</h3>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-background">{stats.totalStudents}</span>
            <span className="font-caption text-secondary flex items-center"><span className="material-symbols-outlined text-sm">arrow_upward</span>active</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-tertiary/5 rounded-bl-full translate-x-4 -translate-y-4" />
          <h3 className="font-metric-label text-on-surface-variant mb-2">Active Cohorts</h3>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-background">{stats.cohorts.length}</span>
            <span className="font-caption text-on-surface-variant">cohorts running</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-secondary/5 rounded-bl-full translate-x-4 -translate-y-4" />
          <h3 className="font-metric-label text-on-surface-variant mb-2">Latest Cohort</h3>
          {stats.cohorts[0] ? (
            <div className="flex flex-col gap-1 mt-1">
              <span className="font-body-md font-semibold text-on-surface">{stats.cohorts[0].name}</span>
              <div className="w-full bg-surface-container-high rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full w-full" />
              </div>
            </div>
          ) : (
            <p className="text-on-surface-variant font-body-md mt-1">No cohorts yet</p>
          )}
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-6 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-bright">
          <div className="flex space-x-1 border border-outline-variant rounded-lg p-1 bg-surface-container-low">
            {['All Students', 'Active', 'Invited'].map((label, i) => (
              <button key={label} className={`px-4 py-1.5 font-metric-label text-metric-label rounded-md transition-colors ${i === 0 ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/50' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-on-background placeholder:text-outline-variant transition-colors" placeholder="Search by name or ID..." type="text" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant">
                {['Student Details', 'Student ID', 'Date Enrolled', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`py-4 px-6 font-metric-label text-metric-label text-on-surface-variant font-semibold ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-on-surface-variant font-body-md">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-outline">person_off</span>
                    No students enrolled yet. Use the buttons above to get started.
                  </td>
                </tr>
              ) : students.map((student: any) => {
                const initials = (student.name || student.email || 'U').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
                const colors = ['bg-primary-fixed-dim text-on-primary-fixed', 'bg-tertiary-fixed text-on-tertiary-fixed-variant', 'bg-secondary-fixed text-on-secondary-fixed'];
                const ci = (student.name?.charCodeAt(0) ?? 0) % 3;
                return (
                  <tr key={student.id} className="hover:bg-surface-container-lowest/50 transition-colors group cursor-pointer">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${colors[ci]}`}>{initials}</div>
                        <div>
                          <p className="font-body-md font-semibold text-on-background group-hover:text-primary transition-colors">{student.name || '—'}</p>
                          <p className="font-caption text-on-surface-variant">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant text-sm font-mono">{student.studentId}</td>
                    <td className="py-4 px-6 text-on-surface-variant font-body-md">{student.dateEnrolled}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container-high">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-outline-variant bg-surface-bright flex items-center justify-between">
          <span className="font-body-md text-body-md text-on-surface-variant">Showing {students.length} of {stats.totalStudents} entries</span>
          <div className="flex space-x-2">
            <button className="p-2 rounded-lg border border-outline-variant text-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40" disabled><span className="material-symbols-outlined">chevron_left</span></button>
            <button className="p-2 rounded-lg border border-outline-variant text-on-background hover:bg-surface-container-low transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
