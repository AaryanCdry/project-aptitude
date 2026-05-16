import React from 'react';
import { getAdminReportData } from '@/app/actions/reports';
import ReportsClient from '@/app/(dashboard)/admin/reports/ReportsClient';

export default async function SubAdminReportsPage() {
  const data = await getAdminReportData();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Department Reports</h1>
          <p className="font-body-md text-on-surface-variant">View and export department performance data.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Department Students', value: data.totalStudents, icon: 'group', color: 'text-primary' },
          { label: 'Tests Completed', value: data.totalTests, icon: 'task_alt', color: 'text-secondary' },
          { label: 'Avg Score', value: `${data.overallAvg}%`, icon: 'analytics', color: 'text-tertiary' },
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

      <ReportsClient rows={data.rows} />
    </div>
  );
}
