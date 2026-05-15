import React from 'react';
import Link from 'next/link';
import { getMentorDashboard } from '@/app/actions/mentor';

function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className={`rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 ${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}`}>
      {initials}
    </div>
  );
}

export default async function MentorDashboardPage() {
  const data = await getMentorDashboard();
  const { students, totalStudents, activeStudents, atRiskCount, overallAvg, recentTests } = data;

  const atRisk = students.filter((s: any) => s.isAtRisk);
  const topStudents = [...students]
    .filter((s: any) => s.avgScore !== null)
    .sort((a: any, b: any) => b.avgScore - a.avgScore)
    .slice(0, 5);

  return (
    <div className="p-6 max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display-sm text-on-background mb-1">Mentor Dashboard</h1>
        <p className="font-body-md text-on-surface-variant">Monitor your students' performance and flag at-risk learners.</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: totalStudents, icon: 'group', color: 'text-primary' },
          { label: 'Active Learners', value: activeStudents, icon: 'trending_up', color: 'text-secondary' },
          { label: 'At Risk', value: atRiskCount, icon: 'warning', color: 'text-error' },
          { label: 'Avg Class Score', value: `${overallAvg}%`, icon: 'analytics', color: 'text-primary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              <p className="font-caption text-on-surface-variant">{label}</p>
            </div>
            <p className={`font-display-sm text-[28px] font-bold ${label === 'At Risk' && atRiskCount > 0 ? 'text-error' : 'text-on-surface'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Student roster */}
        <div className="xl:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
            <h2 className="font-headline-md text-on-surface font-semibold">Student Roster</h2>
            <Link href="/mentor/students" className="font-caption text-primary hover:underline flex items-center gap-1">
              View all <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant">
                  {['Student', 'Tests', 'Avg Score', 'Status'].map(h => (
                    <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {students.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-outline">group</span>
                    No students enrolled yet.
                  </td></tr>
                ) : students.slice(0, 8).map((s: any) => (
                  <tr key={s.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={s.name ?? s.email} size="sm" />
                        <div>
                          <p className="font-body-md font-semibold text-on-surface">{s.name ?? '—'}</p>
                          <p className="font-caption text-on-surface-variant">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-body-md text-on-surface-variant">{s.testsCompleted}</td>
                    <td className="py-3 px-5">
                      {s.avgScore !== null ? (
                        <span className={`font-body-md font-bold ${s.avgScore >= 75 ? 'text-secondary' : s.avgScore >= 50 ? 'text-primary' : 'text-error'}`}>
                          {s.avgScore}%
                        </span>
                      ) : <span className="text-outline font-caption italic">No tests</span>}
                    </td>
                    <td className="py-3 px-5">
                      {s.isAtRisk
                        ? <span className="inline-flex items-center gap-1 text-xs bg-error-container text-error px-2 py-0.5 rounded-full font-bold"><span className="material-symbols-outlined text-sm">warning</span>At Risk</span>
                        : s.testsCompleted > 0
                        ? <span className="inline-flex items-center gap-1 text-xs bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full font-bold"><span className="w-1.5 h-1.5 bg-secondary rounded-full" />Active</span>
                        : <span className="text-xs text-outline italic">Inactive</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* At Risk */}
          <div className="bg-error-container/20 border border-error/20 rounded-xl p-5 shadow-sm">
            <h2 className="font-headline-md text-error font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>warning</span>
              At Risk ({atRiskCount})
            </h2>
            {atRisk.length === 0 ? (
              <p className="font-caption text-on-surface-variant">No at-risk students. Great work! 🎉</p>
            ) : atRisk.slice(0, 4).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-error/10 last:border-0">
                <div className="flex items-center gap-2">
                  <InitialsAvatar name={s.name ?? s.email} size="sm" />
                  <div>
                    <p className="font-body-md text-on-surface text-sm font-semibold">{s.name ?? s.email}</p>
                    <p className="font-caption text-error">{s.avgScore}% avg</p>
                  </div>
                </div>
                <Link href={`/mentor/students?id=${s.id}`} className="text-xs text-primary hover:underline">View</Link>
              </div>
            ))}
          </div>

          {/* Top performers */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <h2 className="font-headline-md text-on-surface font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f59e0b]" style={{ fontVariationSettings: '"FILL" 1' }}>emoji_events</span>
              Top Performers
            </h2>
            {topStudents.map((s: any, i: number) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-outline-variant last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-[#f59e0b] text-white' : 'bg-surface-container text-on-surface-variant'}`}>{i + 1}</span>
                  <p className="font-body-md text-on-surface text-sm">{s.name ?? s.email}</p>
                </div>
                <span className="font-bold text-secondary text-sm">{s.avgScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
