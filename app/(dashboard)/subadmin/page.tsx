import React from 'react';
import Link from 'next/link';
import { getSubAdminData } from '@/app/actions/reports';

export default async function SubAdminDashboard() {
  const { students } = await getSubAdminData();

  const avgScore = students.filter(s => s.avgScore > 0).length
    ? Math.round(students.filter(s => s.avgScore > 0).reduce((a, s) => a + s.avgScore, 0) / students.filter(s => s.avgScore > 0).length)
    : 0;
  const atRisk = students.filter(s => s.avgScore > 0 && s.avgScore < 50).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Department Dashboard</h1>
        <p className="font-body-md text-on-surface-variant">Overview of your department's students and performance.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: students.length, icon: 'group', color: 'text-primary' },
          { label: 'Active', value: students.filter(s => s.avgScore > 0).length, icon: 'person_check', color: 'text-secondary' },
          { label: 'Dept Avg Score', value: avgScore > 0 ? `${avgScore}%` : '—', icon: 'analytics', color: 'text-tertiary' },
          { label: 'At Risk', value: atRisk, icon: 'warning', color: 'text-error' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              <p className="font-caption text-on-surface-variant">{label}</p>
            </div>
            <p className="font-display-sm text-2xl text-on-surface font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/subadmin/classes" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:border-primary transition-colors group">
          <span className="material-symbols-outlined text-3xl text-primary mb-3 block" style={{ fontVariationSettings: '"FILL" 1' }}>meeting_room</span>
          <h3 className="font-headline-md text-on-surface mb-1">Manage Classes</h3>
          <p className="font-caption text-on-surface-variant">View and manage classes in your department</p>
        </Link>
        <Link href="/subadmin/reports" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:border-primary transition-colors group">
          <span className="material-symbols-outlined text-3xl text-secondary mb-3 block" style={{ fontVariationSettings: '"FILL" 1' }}>assessment</span>
          <h3 className="font-headline-md text-on-surface mb-1">View Reports</h3>
          <p className="font-caption text-on-surface-variant">Export department performance reports</p>
        </Link>
      </div>

      {/* Student list */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright">
          <h2 className="font-headline-md text-on-surface">Students</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              {['Name', 'Email', 'Avg Score', 'Status'].map(h => (
                <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-on-surface-variant font-body-md">No students found.</td>
              </tr>
            ) : students.map(s => (
              <tr key={s.id} className="hover:bg-surface-container transition-colors">
                <td className="py-3 px-5 font-body-md text-on-surface">{s.name ?? '—'}</td>
                <td className="py-3 px-5 font-body-md text-on-surface-variant">{s.email}</td>
                <td className="py-3 px-5">
                  <span className={`font-bold ${s.avgScore >= 75 ? 'text-secondary' : s.avgScore >= 50 ? 'text-primary' : s.avgScore > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {s.avgScore > 0 ? `${s.avgScore}%` : '—'}
                  </span>
                </td>
                <td className="py-3 px-5">
                  {s.avgScore === 0 ? (
                    <span className="bg-surface-container-high text-on-surface-variant text-xs font-bold px-2.5 py-1 rounded-full">No tests</span>
                  ) : s.avgScore < 50 ? (
                    <span className="bg-error-container text-on-error-container text-xs font-bold px-2.5 py-1 rounded-full">At Risk</span>
                  ) : (
                    <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-bold px-2.5 py-1 rounded-full">Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
