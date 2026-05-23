import React from 'react';
import Link from 'next/link';
import { getClasses, getDepartments, getClassStudentCounts, getClassMentors } from '@/app/actions/departments';
import { getCallerScope } from '@/app/actions/scope';
import CreateClassForm from './CreateClassForm';

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const { dept: deptFilter } = await searchParams;

  const [classes, departments, scope] = await Promise.all([
    getClasses(deptFilter),
    getDepartments(),
    getCallerScope(),
  ]);
  const isHOD = scope.role === 'SUB_ADMIN';

  const classIds = classes.map((c: any) => c.id);
  const [studentCounts, mentorsByClass] = await Promise.all([
    getClassStudentCounts(classIds),
    getClassMentors(classIds),
  ]);

  // Group by department
  const grouped: Record<string, any[]> = {};
  (classes as any[]).forEach((cls) => {
    const deptName = cls.departments?.name ?? 'Unassigned';
    if (!grouped[deptName]) grouped[deptName] = [];
    grouped[deptName].push(cls);
  });

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-background mb-2">Classes & Sections</h1>
          <p className="font-body-md text-on-surface-variant">
            {isHOD
              ? 'Class batches in your department. Assign mentors and track student rosters.'
              : 'Manage class batches across all departments. Assign students and mentors.'}
          </p>
        </div>
        <div className="flex gap-3">
          {!isHOD && (
            <Link href="/admin/departments" className="px-5 py-3 border border-outline-variant rounded-lg font-metric-label text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">account_tree</span>
              Departments
            </Link>
          )}
          <CreateClassForm
            departments={(departments as any[]).map((d: any) => ({ id: d.id, name: d.name, course_type: d.course_type ?? '' }))}
            defaultDeptId={deptFilter}
          />
        </div>
      </div>

      {/* Department filter pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        <Link
          href="/admin/classes"
          className={`px-4 py-1.5 rounded-full text-sm font-metric-label border transition-colors ${!deptFilter ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
        >
          All Departments
        </Link>
        {(departments as any[]).map((d: any) => (
          <Link
            key={d.id}
            href={`/admin/classes?dept=${d.id}`}
            className={`px-4 py-1.5 rounded-full text-sm font-metric-label border transition-colors ${deptFilter === d.id ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {d.name}
          </Link>
        ))}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Classes', value: classes.length, icon: 'meeting_room' },
          { label: 'Total Students', value: Object.values(studentCounts).reduce((a: number, b: number) => a + b, 0), icon: 'group' },
          { label: 'Departments', value: Object.keys(grouped).length, icon: 'account_tree' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
            </div>
            <div>
              <p className="font-caption text-on-surface-variant">{label}</p>
              <p className="font-headline-md text-on-surface text-[24px] font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Class list grouped by department */}
      {classes.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline block mb-3">meeting_room</span>
          <p className="font-headline-md text-on-surface mb-2">No classes yet</p>
          <p className="font-body-md text-on-surface-variant mb-6">Create a department first, then add classes within it.</p>
          <Link href="/admin/departments" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-on-primary-fixed-variant transition-colors">
            <span className="material-symbols-outlined">account_tree</span>
            Go to Departments
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([deptName, cls]) => (
            <div key={deptName}>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>account_tree</span>
                <h2 className="font-headline-md text-on-surface text-[18px] font-semibold">{deptName}</h2>
                <span className="bg-surface-container text-on-surface-variant text-xs px-2 py-0.5 rounded-full">{cls.length} classes</span>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-bright">
                      {['Class Name', 'Year / Section', 'Students', 'Mentor', 'Created', 'Actions'].map((h, i) => (
                        <th key={h} className={`py-3 px-5 font-metric-label text-metric-label text-on-surface-variant ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {cls.map((c: any) => (
                      <tr key={c.id} className="hover:bg-surface-container transition-colors group">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-outline text-xl">meeting_room</span>
                            <span className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">{c.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-on-surface-variant font-body-md">
                          {c.year ? `Year ${c.year}` : '—'}{c.section ? ` · Section ${c.section}` : ''}
                        </td>
                        <td className="py-3 px-5">
                          <span className="inline-flex items-center gap-1.5 font-body-md text-on-surface">
                            <span className="material-symbols-outlined text-secondary text-base">group</span>
                            {studentCounts[c.id] ?? 0}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-on-surface-variant font-caption">
                          {(() => {
                            const ms = mentorsByClass[c.id] ?? [];
                            if (ms.length === 0) return <span className="text-outline italic">Unassigned</span>;
                            if (ms.length === 1) return <span className="text-on-surface">{ms[0].name ?? '—'}</span>;
                            return <span className="text-on-surface">{ms[0].name ?? '—'} <span className="text-on-surface-variant">+{ms.length - 1}</span></span>;
                          })()}
                        </td>
                        <td className="py-3 px-5 text-on-surface-variant font-caption">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <Link
                            href={`/admin/classes/${c.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-metric-label text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">people</span>
                            View Roster
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
