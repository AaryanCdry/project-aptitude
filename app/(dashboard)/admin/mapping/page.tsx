import React from 'react';
import Link from 'next/link';
import { getMappingOverview } from '@/app/actions/mapping';

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: 'bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim',
  SCHEDULED: 'bg-surface-container text-on-surface-variant border border-outline-variant',
  COMPLETED: 'bg-surface-container-high text-on-surface border border-outline-variant',
};

export default async function MappingPage() {
  const overview = await getMappingOverview();

  const totalClasses = overview.reduce((a, d) => a + d.classes.length, 0);
  const totalStudents = overview.reduce((a, d) => a + d.classes.reduce((b: number, c: any) => b + c.studentCount, 0), 0);
  const mappedClasses = overview.reduce((a, d) => a + d.classes.filter((c: any) => c.cohort !== null).length, 0);

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-background mb-2">Cohort Mapping</h1>
          <p className="font-body-md text-on-surface-variant">
            See how departments and classes connect to cohorts.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/classes" className="px-5 py-2.5 border border-outline-variant rounded-lg font-metric-label text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">meeting_room</span>
            Manage Classes
          </Link>
          <Link href="/admin/cohorts" className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-primary/90 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">group</span>
            Manage Cohorts
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Classes', value: totalClasses, icon: 'meeting_room' },
          { label: 'Total Students', value: totalStudents, icon: 'group' },
          { label: 'Classes Mapped', value: `${mappedClasses} / ${totalClasses}`, icon: 'hub' },
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

      {/* Department sections */}
      {overview.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-outline block mb-3">hub</span>
          <p className="font-headline-md text-on-surface mb-2">No departments yet</p>
          <p className="font-body-md text-on-surface-variant mb-6">Set up departments and classes first, then map them to cohorts.</p>
          <Link href="/admin/departments" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label">
            <span className="material-symbols-outlined">account_tree</span>
            Go to Departments
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {overview.map((dept) => (
            <div key={dept.deptId}>
              {/* Dept header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>account_tree</span>
                <h2 className="font-headline-md text-on-surface text-[18px] font-semibold">{dept.deptName}</h2>
                {dept.courseType && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    {dept.courseType}
                  </span>
                )}
                <span className="bg-surface-container text-on-surface-variant text-xs px-2 py-0.5 rounded-full">{dept.classes.length} classes</span>
              </div>

              {dept.classes.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center text-on-surface-variant font-body-md">
                  No classes in this department.{' '}
                  <Link href="/admin/classes" className="text-primary underline underline-offset-2">Add classes</Link>
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-bright">
                        {['Class', 'Year / Section', 'Students', 'Cohort', 'Status'].map((h) => (
                          <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {dept.classes.map((cls: any) => (
                        <tr key={cls.classId} className="hover:bg-surface-container transition-colors">
                          <td className="py-3 px-5">
                            <Link
                              href={`/admin/classes/${cls.classId}`}
                              className="flex items-center gap-2 group"
                            >
                              <span className="material-symbols-outlined text-outline text-xl">meeting_room</span>
                              <span className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">{cls.className}</span>
                            </Link>
                          </td>
                          <td className="py-3 px-5 text-on-surface-variant font-body-md">
                            {cls.year ? `Year ${cls.year}` : '—'}{cls.section ? ` · Section ${cls.section}` : ''}
                          </td>
                          <td className="py-3 px-5">
                            <span className="inline-flex items-center gap-1.5 font-body-md text-on-surface">
                              <span className="material-symbols-outlined text-secondary text-base">group</span>
                              {cls.studentCount}
                            </span>
                          </td>
                          <td className="py-3 px-5">
                            {cls.cohort ? (
                              <Link
                                href={`/admin/cohorts/${cls.cohort.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim hover:bg-secondary/10 transition-colors"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                {cls.cohort.name}
                              </Link>
                            ) : (
                              <Link
                                href="/admin/cohorts"
                                className="font-caption text-primary hover:underline"
                              >
                                + Create cohort
                              </Link>
                            )}
                          </td>
                          <td className="py-3 px-5">
                            {cls.cohort ? (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase ${STATUS_CHIP[cls.cohort.status] ?? ''}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cls.cohort.status === 'ACTIVE' ? 'bg-secondary' : 'bg-outline'}`} />
                                {cls.cohort.status}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/40 text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
