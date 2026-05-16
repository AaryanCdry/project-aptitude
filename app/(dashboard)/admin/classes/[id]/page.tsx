import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClassWithStudents } from '@/app/actions/mapping';
import { getCohorts } from '@/app/actions/cohorts';
import AssignToCohortPanel from './AssignToCohortPanel';

export default async function ClassRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [classData, cohorts] = await Promise.all([
    getClassWithStudents(id),
    getCohorts(),
  ]);

  if (!classData) notFound();

  const { classInfo, students, totalStudents, inCohort, notAssigned } = classData;

  const colors = [
    'bg-primary-fixed-dim text-on-primary-fixed',
    'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    'bg-secondary-fixed text-on-secondary-fixed',
  ];

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 font-caption text-on-surface-variant">
        <Link href="/admin/classes" className="hover:text-primary transition-colors">Classes</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface font-semibold">{classInfo.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
          </div>
          <div>
            <h1 className="font-display-sm text-display-sm text-on-background">{classInfo.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {classInfo.deptName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {classInfo.deptName}
                </span>
              )}
              {classInfo.courseType && (
                <span className="font-caption text-on-surface-variant">{classInfo.courseType}</span>
              )}
              {classInfo.year && (
                <span className="font-caption text-on-surface-variant">· Year {classInfo.year}</span>
              )}
              {classInfo.section && (
                <span className="font-caption text-on-surface-variant">· Section {classInfo.section}</span>
              )}
            </div>
          </div>
        </div>
        <Link
          href="/admin/enrollment/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-primary/90 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Enroll Student
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Students', value: totalStudents, icon: 'group', color: 'text-primary' },
          { label: 'In a Cohort', value: inCohort, icon: 'groups', color: 'text-secondary' },
          { label: 'Not Assigned', value: notAssigned, icon: 'person_off', color: 'text-on-surface-variant' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full bg-surface-container flex items-center justify-center ${color}`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
            </div>
            <div>
              <p className="font-caption text-on-surface-variant">{label}</p>
              <p className="font-headline-md text-on-surface text-[24px] font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Assign to cohort panel */}
      <AssignToCohortPanel
        classId={id}
        cohorts={(cohorts as any[]).map((c: any) => ({ id: c.id, name: c.name }))}
      />

      {/* Student Roster */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-md text-on-surface">Student Roster</h2>
          <span className="font-caption text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">{totalStudents} students</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright">
                {['Student', 'Email', 'Reg ID', 'Section', 'Cohort'].map((h) => (
                  <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-outline">person_off</span>
                    No students in this class yet.
                  </td>
                </tr>
              ) : students.map((s, i) => {
                const initials = (s.name || s.email || 'U').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
                const ci = (s.name?.charCodeAt(0) ?? i) % 3;
                return (
                  <tr key={s.id} className="hover:bg-surface-container transition-colors group">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${colors[ci]}`}>{initials}</div>
                        <span className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">{s.name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-caption text-on-surface-variant">{s.email}</td>
                    <td className="py-3 px-5">
                      {s.registration_id ? (
                        <span className="font-mono text-sm bg-surface-container px-2 py-0.5 rounded border border-outline-variant">{s.registration_id}</span>
                      ) : (
                        <span className="text-on-surface-variant/40 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {s.section ? (
                        <span className="text-sm font-medium bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant">{s.section}</span>
                      ) : (
                        <span className="text-on-surface-variant/40 text-sm">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {s.cohortName ? (
                        <Link
                          href={`/admin/cohorts/${s.cohortId}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim hover:bg-secondary/10 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          {s.cohortName}
                        </Link>
                      ) : (
                        <span className="font-caption text-on-surface-variant/60 italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
