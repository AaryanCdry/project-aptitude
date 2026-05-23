import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDepartments } from '@/app/actions/departments';
import { getCallerScope } from '@/app/actions/scope';
import CreateDepartmentForm from './CreateDepartmentForm';
import AddClassButton from './AddClassButton';

const COURSE_COLORS: Record<string, string> = {
  BE: 'bg-primary-fixed-dim text-on-primary-fixed',
  BTech: 'bg-primary-fixed-dim text-on-primary-fixed',
  BCA: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  BSc: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  MBA: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  MCA: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Other: 'bg-surface-container-high text-on-surface',
};

export default async function DepartmentsPage() {
  // Department setup is a Principal-only task; HOD already heads one department.
  const scope = await getCallerScope();
  if (scope.role && scope.role !== 'ADMIN' && scope.role !== 'SUPER_ADMIN') redirect('/admin');

  const departments = await getDepartments();

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-background mb-2">Department Setup</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Create academic departments, assign course types and semester structure.
          </p>
        </div>
        <CreateDepartmentForm />
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Departments', value: departments.length, icon: 'account_tree', color: 'text-primary' },
          { label: 'Total Classes', value: departments.reduce((s: number, d: any) => s + (d.classCount ?? 0), 0), icon: 'meeting_room', color: 'text-secondary' },
          { label: 'Course Types', value: [...new Set(departments.map((d: any) => d.course_type).filter(Boolean))].length, icon: 'school', color: 'text-primary' },
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

      {/* Department cards */}
      {departments.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline block mb-3">account_tree</span>
          <p className="font-headline-md text-on-surface mb-2">No departments yet</p>
          <p className="font-body-md text-on-surface-variant">Use the button above to add your first department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept: any) => {
            const colorClass = COURSE_COLORS[dept.course_type] ?? COURSE_COLORS.Other;
            return (
              <div key={dept.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-[0px_4px_16px_-4px_rgba(79,70,229,0.1)] transition-shadow group">
                {/* Card Header */}
                <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>account_tree</span>
                    </div>
                    <div>
                      <p className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">{dept.name}</p>
                      <p className="font-caption text-on-surface-variant">{dept.semester_count} semesters</p>
                    </div>
                  </div>
                  {dept.course_type && (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${colorClass}`}>
                      {dept.course_type}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <p className="font-caption text-on-surface-variant">Classes</p>
                      <p className="font-headline-md text-[22px] text-on-surface font-bold">{dept.classCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-caption text-on-surface-variant">Semesters</p>
                      <p className="font-headline-md text-[22px] text-on-surface font-bold">{dept.semester_count}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-caption text-on-surface-variant">Created</p>
                      <p className="font-caption text-on-surface">{new Date(dept.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <AddClassButton dept={{ id: dept.id, name: dept.name, course_type: dept.course_type ?? '' }} />
                    <Link
                      href={`/admin/classes?dept=${dept.id}`}
                      className="px-3 py-2 text-on-surface-variant border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-1 font-metric-label text-[13px]"
                    >
                      <span className="material-symbols-outlined text-[16px]">list</span>
                      View
                    </Link>
                    <button className="px-3 py-2 text-outline hover:text-error border border-outline-variant rounded-lg hover:border-error/30 hover:bg-error-container/20 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
