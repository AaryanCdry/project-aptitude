import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClassWithStudents, getAddableStudentsForClass } from '@/app/actions/mapping';
import { getCohorts } from '@/app/actions/cohorts';
import AssignToCohortPanel from './AssignToCohortPanel';
import AddStudentsButton from './AddStudentsButton';
import ClassRosterTable from './ClassRosterTable';

export default async function ClassRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [classData, cohorts, addableStudents] = await Promise.all([
    getClassWithStudents(id),
    getCohorts(),
    getAddableStudentsForClass(id),
  ]);

  if (!classData) notFound();

  const { classInfo, students, totalStudents, inCohort, notAssigned } = classData;

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
        <AddStudentsButton
          classId={id}
          className={classInfo.name}
          candidates={addableStudents as any}
        />
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
      <ClassRosterTable students={students as any} />
    </div>
  );
}
