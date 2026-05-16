import React from 'react';
import Link from 'next/link';
import { getSuperAdminData } from '@/app/actions/reports';

export default async function SuperDashboard() {
  const { colleges, totalColleges, totalStudents, totalTests } = await getSuperAdminData();

  const recentColleges = colleges.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Super Admin Dashboard</h1>
        <p className="font-body-md text-on-surface-variant">Platform-wide overview of all colleges and activity.</p>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Colleges', value: totalColleges, icon: 'business', color: 'text-error' },
          { label: 'Total Students', value: totalStudents, icon: 'group', color: 'text-primary' },
          { label: 'Tests Completed', value: totalTests, icon: 'task_alt', color: 'text-secondary' },
          { label: 'Avg Tests/College', value: totalColleges > 0 ? Math.round(totalTests / totalColleges) : 0, icon: 'show_chart', color: 'text-tertiary' },
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

      {/* Quick nav */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link href="/super/colleges" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:border-error transition-colors">
          <span className="material-symbols-outlined text-3xl text-error mb-3 block" style={{ fontVariationSettings: '"FILL" 1' }}>business</span>
          <h3 className="font-headline-md text-on-surface mb-1">College Management</h3>
          <p className="font-caption text-on-surface-variant">Add, suspend, and manage colleges</p>
        </Link>
        <Link href="/super/analytics" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:border-primary transition-colors">
          <span className="material-symbols-outlined text-3xl text-primary mb-3 block" style={{ fontVariationSettings: '"FILL" 1' }}>analytics</span>
          <h3 className="font-headline-md text-on-surface mb-1">Global Analytics</h3>
          <p className="font-caption text-on-surface-variant">Cross-college trends and leaderboard</p>
        </Link>
        <Link href="/super/settings" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:border-secondary transition-colors">
          <span className="material-symbols-outlined text-3xl text-secondary mb-3 block" style={{ fontVariationSettings: '"FILL" 1' }}>settings</span>
          <h3 className="font-headline-md text-on-surface mb-1">Platform Settings</h3>
          <p className="font-caption text-on-surface-variant">API keys, pricing, feature flags</p>
        </Link>
      </div>

      {/* Recent colleges */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
          <h2 className="font-headline-md text-on-surface">Colleges</h2>
          <Link href="/super/colleges" className="font-caption text-primary hover:underline flex items-center gap-1">
            View all <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>
        {colleges.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline block mb-2">business</span>
            <p className="font-body-md text-on-surface-variant">No colleges added yet.</p>
            <Link href="/super/colleges" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label">
              Add College
            </Link>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant">
                {['College', 'Code', 'Status', 'Added'].map(h => (
                  <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {recentColleges.map((c: any) => (
                <tr key={c.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 px-5 font-body-md text-on-surface font-medium">{c.name}</td>
                  <td className="py-3 px-5 font-mono text-sm text-on-surface-variant">{c.code}</td>
                  <td className="py-3 px-5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === 'ACTIVE' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-error-container text-on-error-container'}`}>
                      {c.status ?? 'ACTIVE'}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-caption text-on-surface-variant">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
