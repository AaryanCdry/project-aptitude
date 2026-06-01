import React from 'react';
import Link from 'next/link';
import { getClasses, getDepartments, getClassStudentCounts, getClassMentors } from '@/app/actions/departments';
import { getCallerScope } from '@/app/actions/scope';
import CreateClassForm from './CreateClassForm';
import ClassRowActions from './ClassRowActions';

interface ClassRow {
  id: string;
  name: string;
  dept_id: string;
  year: number | null;
  section: string | null;
  created_at: string;
  // Supabase infers joined rows as arrays even for many-to-one FKs
  departments: Array<{ name: string; course_type: string | null }> | null;
  sub_admin: Array<{ id: string; name: string | null; email: string }> | null;
}

interface DeptRow {
  id: string;
  name: string;
  course_type: string | null;
}

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

  const typedClasses = classes as unknown as ClassRow[];
  const typedDepts = departments as unknown as DeptRow[];

  const classIds = typedClasses.map((c) => c.id);
  const [studentCounts, mentorsByClass] = await Promise.all([
    getClassStudentCounts(classIds),
    getClassMentors(classIds),
  ]);

  const totalStudents = Object.values(studentCounts).reduce((a: number, b: number) => a + b, 0);

  const grouped: Record<string, ClassRow[]> = {};
  typedClasses.forEach((cls) => {
    const deptName = cls.departments?.[0]?.name ?? 'Unassigned';
    if (!grouped[deptName]) grouped[deptName] = [];
    grouped[deptName].push(cls);
  });

  const deptList = typedDepts.map((d) => ({ id: d.id, name: d.name }));

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
            <Link href="/admin/departments" className="px-5 py-2.5 border border-outline-variant rounded-lg font-metric-label text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              Departments
            </Link>
          )}
          <CreateClassForm
            departments={typedDepts.map((d) => ({ id: d.id, name: d.name, course_type: d.course_type ?? '' }))}
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
        {typedDepts.map((d) => (
          <Link
            key={d.id}
            href={`/admin/classes?dept=${d.id}`}
            className={`px-4 py-1.5 rounded-full text-sm font-metric-label border transition-colors ${deptFilter === d.id ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {d.name}
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-t-2xl" />
          <div className="flex items-start justify-between mb-5">
            <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Total Classes</p>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
            </div>
          </div>
          <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-2">{classes.length}</p>
          <p className="font-caption text-on-surface-variant text-xs">across all departments</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary rounded-t-2xl" />
          <div className="flex items-start justify-between mb-5">
            <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Total Students</p>
            <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
            </div>
          </div>
          <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-2">{totalStudents}</p>
          <p className="font-caption text-on-surface-variant text-xs">enrolled in classes</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-tertiary rounded-t-2xl" />
          <div className="flex items-start justify-between mb-5">
            <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Departments</p>
            <div className="w-11 h-11 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>account_tree</span>
            </div>
          </div>
          <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-2">{Object.keys(grouped).length}</p>
          <p className="font-caption text-on-surface-variant text-xs">with active classes</p>
        </div>
      </div>

      {/* Class list */}
      {classes.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline block mb-3">meeting_room</span>
          <p className="font-headline-md text-on-surface mb-2">No classes yet</p>
          <p className="font-body-md text-on-surface-variant mb-6">Create a department first, then add classes within it.</p>
          <Link href="/admin/departments" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined">account_tree</span>
            Go to Departments
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([deptName, cls]) => (
            <div key={deptName}>
              {/* Department group header */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>account_tree</span>
                </div>
                <h2 className="font-headline-md text-on-surface text-[16px] font-semibold">{deptName}</h2>
                <span className="bg-primary/8 text-primary text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-primary/15">
                  {cls.length} {cls.length === 1 ? 'class' : 'classes'}
                </span>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low/40">
                      {['Class Name', 'Year / Section', 'Students', 'Mentor', 'Created', 'Actions'].map((h, i) => (
                        <th key={h} className={`py-3 px-5 font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {cls.map((c) => {
                      const mentors = mentorsByClass[c.id] ?? [];
                      const count = studentCounts[c.id] ?? 0;
                      return (
                        <tr key={c.id} className="hover:bg-surface-container/40 transition-colors group">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
                              </div>
                              <span className="font-semibold text-[13px] text-on-surface group-hover:text-primary transition-colors">{c.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-body-md text-on-surface-variant text-[13px]">
                              {c.year ? `Year ${c.year}` : '—'}{c.section ? ` · Section ${c.section}` : ''}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="inline-flex items-center gap-1.5 text-[13px]">
                              <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>group</span>
                              <span className="font-semibold text-on-surface">{count}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            {mentors.length === 0 ? (
                              <span className="text-outline text-[12px] italic">Unassigned</span>
                            ) : (
                              <span className="text-on-surface text-[13px]">
                                {mentors[0].name ?? '—'}
                                {mentors.length > 1 && <span className="text-on-surface-variant ml-1">+{mentors.length - 1}</span>}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-on-surface-variant text-[12px] whitespace-nowrap">
                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-5">
                            <ClassRowActions
                              cls={{ id: c.id, name: c.name, dept_id: c.dept_id, year: c.year, section: c.section }}
                              departments={deptList}
                            />
                          </td>
                        </tr>
                      );
                    })}
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
