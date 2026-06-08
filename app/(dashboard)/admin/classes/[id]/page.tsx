import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClassWithStudents, getAddableStudentsForClass } from '@/app/actions/mapping';
import AddStudentsButton from './AddStudentsButton';
import ClassRosterTable from './ClassRosterTable';

export default async function ClassRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [classData, addableStudents] = await Promise.all([
    getClassWithStudents(id),
    getAddableStudentsForClass(id),
  ]);

  if (!classData) notFound();

  const { classInfo, students, totalStudents } = classData;

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
          candidates={addableStudents}
        />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 gap-4 mb-8 max-w-xs">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
          </div>
          <div>
            <p className="font-caption text-on-surface-variant">Total Students</p>
            <p className="font-headline-md text-on-surface text-[24px] font-bold">{totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Student Roster */}
      <ClassRosterTable students={students} />
    </div>
  );
}
