import React from 'react';
import { redirect } from 'next/navigation';
import { getDepartments } from '@/app/actions/departments';
import { getCallerScope } from '@/app/actions/scope';
import CreateDepartmentForm from './CreateDepartmentForm';
import DepartmentCard from './DepartmentCard';

export default async function DepartmentsPage() {
  const scope = await getCallerScope();
  if (scope.role && scope.role !== 'ADMIN' && scope.role !== 'SUPER_ADMIN') redirect('/admin');

  const departments = await getDepartments();
  const totalClasses = departments.reduce((s: number, d: any) => s + (d.classCount ?? 0), 0);

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-background mb-2">Department Setup</h1>
          <p className="font-body-md text-on-surface-variant">
            Create academic departments, assign course types and semester structure.
          </p>
        </div>
        <CreateDepartmentForm />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">

        {/* Total Departments */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-t-2xl" />
          <div className="flex items-start justify-between mb-5">
            <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Total Departments</p>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>account_tree</span>
            </div>
          </div>
          <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-2">{departments.length}</p>
          <p className="font-caption text-on-surface-variant text-xs">academic departments</p>
        </div>

        {/* Total Classes */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary rounded-t-2xl" />
          <div className="flex items-start justify-between mb-5">
            <p className="font-caption text-on-surface-variant text-[11px] uppercase tracking-widest mt-0.5">Total Classes</p>
            <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
            </div>
          </div>
          <p className="font-display-lg text-on-surface text-5xl font-bold tabular-nums leading-none mb-2">{totalClasses}</p>
          <p className="font-caption text-on-surface-variant text-xs">across all departments</p>
        </div>
      </div>

      {/* Department Cards */}
      {departments.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline block mb-3">account_tree</span>
          <p className="font-headline-md text-on-surface mb-2">No departments yet</p>
          <p className="font-body-md text-on-surface-variant">Use the button above to add your first department.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept: any) => (
            <DepartmentCard key={dept.id} dept={dept} />
          ))}
        </div>
      )}
    </div>
  );
}
