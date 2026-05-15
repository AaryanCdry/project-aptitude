import React from 'react';
import { getAssessments } from '@/app/actions/mentor';

const STATUS_CHIP: Record<string, string> = {
  COMPLETED: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  IN_PROGRESS: 'bg-primary-fixed-dim text-on-primary-fixed',
};

const TYPE_CHIP: Record<string, string> = {
  CENTER: 'bg-primary/10 text-primary border-primary/20',
  SELF:   'bg-surface-container-high text-on-surface border-outline-variant',
};

export default async function AssessmentsPage() {
  const tests = await getAssessments();

  const completed = tests.filter((t: any) => t.status === 'COMPLETED').length;
  const inProgress = tests.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const centerTests = tests.filter((t: any) => t.type === 'CENTER').length;

  return (
    <div className="p-6 max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display-sm text-on-background mb-1">Assessments</h1>
          <p className="font-body-md text-on-surface-variant">Track scheduled and completed test sessions across your students.</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Sessions', value: tests.length, icon: 'quiz', color: 'text-primary' },
          { label: 'Completed', value: completed, icon: 'task_alt', color: 'text-secondary' },
          { label: 'Center Tests', value: centerTests, icon: 'location_on', color: 'text-primary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              <p className="font-caption text-on-surface-variant">{label}</p>
            </div>
            <p className="font-display-sm text-[28px] font-bold text-on-surface">{value}</p>
          </div>
        ))}
      </div>

      {/* Tests table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright">
          <h2 className="font-headline-md text-on-surface font-semibold">All Test Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant">
                {['Student', 'Type', 'Status', 'Class', 'Scheduled', 'Completed'].map(h => (
                  <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline block mb-2">quiz</span>
                    <p className="font-body-md text-on-surface-variant">No assessments yet.</p>
                  </td>
                </tr>
              ) : (tests as any[]).map((t: any) => {
                const student = t['users!student_id'] ?? t.users;
                const cls = t['classes!class_id'] ?? t.classes;
                return (
                  <tr key={t.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-5">
                      <p className="font-body-md font-semibold text-on-surface">{student?.name ?? '—'}</p>
                      <p className="font-caption text-on-surface-variant">{student?.email}</p>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-0.5 rounded border font-bold ${TYPE_CHIP[t.type] ?? TYPE_CHIP.SELF}`}>{t.type}</span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_CHIP[t.status] ?? 'bg-surface-container text-on-surface'}`}>{t.status}</span>
                    </td>
                    <td className="py-3 px-5 font-caption text-on-surface-variant">
                      {cls ? (
                        <span>
                          {cls.name}
                          {cls.departments?.name && <span className="ml-1 opacity-60">· {cls.departments.name}</span>}
                        </span>
                      ) : <span className="italic text-outline">Unlinked</span>}
                    </td>
                    <td className="py-3 px-5 font-caption text-on-surface-variant">
                      {t.scheduled_at ? new Date(t.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3 px-5 font-caption text-on-surface-variant">
                      {t.completed_at ? new Date(t.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
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
