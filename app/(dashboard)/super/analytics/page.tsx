import React from 'react';
import { getSuperAdminData } from '@/app/actions/reports';
import { createAdminClient } from '@/lib/supabase/admin';

async function getGlobalAnalytics() {
  const supabase = createAdminClient();

  const { data: scores } = await supabase
    .from('scores')
    .select('student_id, domain, score, percentile, created_at, users!student_id(name, email)')
    .order('score', { ascending: false });

  // Domain breakdown
  const domainMap: Record<string, number[]> = {};
  (scores ?? []).forEach((s: any) => {
    if (!domainMap[s.domain]) domainMap[s.domain] = [];
    domainMap[s.domain].push(s.score);
  });

  const domainStats = Object.entries(domainMap).map(([domain, vals]) => ({
    domain,
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    count: vals.length,
    max: Math.max(...vals),
    min: Math.min(...vals),
  })).sort((a, b) => b.avg - a.avg);

  // Top performers (by avg score)
  const studentMap: Record<string, { name: string; email: string; scores: number[] }> = {};
  (scores ?? []).forEach((s: any) => {
    if (!studentMap[s.student_id]) {
      studentMap[s.student_id] = { name: s.users?.name ?? 'Unknown', email: s.users?.email ?? '', scores: [] };
    }
    studentMap[s.student_id].scores.push(s.score);
  });

  const topPerformers = Object.entries(studentMap)
    .map(([id, d]) => ({
      id,
      name: d.name,
      email: d.email,
      avg: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length),
      tests: d.scores.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  return { domainStats, topPerformers, totalScores: (scores ?? []).length };
}

export default async function SuperAnalyticsPage() {
  const [{ totalColleges, totalStudents, totalTests }, { domainStats, topPerformers, totalScores }] = await Promise.all([
    getSuperAdminData(),
    getGlobalAnalytics(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Global Analytics</h1>
        <p className="font-body-md text-on-surface-variant">Cross-college performance trends and top performers.</p>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Colleges', value: totalColleges, icon: 'business', color: 'text-error' },
          { label: 'Students', value: totalStudents, icon: 'group', color: 'text-primary' },
          { label: 'Tests Done', value: totalTests, icon: 'task_alt', color: 'text-secondary' },
          { label: 'Total Scores', value: totalScores, icon: 'analytics', color: 'text-tertiary' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Domain heat map */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <h2 className="font-headline-md text-on-surface mb-5">Domain Performance</h2>
          {domainStats.length === 0 ? (
            <p className="font-body-md text-on-surface-variant text-center py-8">No data yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {domainStats.map((d, i) => (
                <div key={d.domain}>
                  <div className="flex justify-between font-metric-label text-sm mb-1.5">
                    <span className="text-on-surface">{d.domain}</span>
                    <span className={`font-bold ${d.avg >= 75 ? 'text-secondary' : d.avg >= 50 ? 'text-primary' : 'text-error'}`}>{d.avg}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-primary/60'][i % 4]}`}
                      style={{ width: `${d.avg}%` }}
                    />
                  </div>
                  <p className="font-caption text-on-surface-variant mt-1">{d.count} scores · high {d.max}% · low {d.min}%</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top performers */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h2 className="font-headline-md text-on-surface">Top Performers</h2>
          </div>
          {topPerformers.length === 0 ? (
            <p className="font-body-md text-on-surface-variant text-center py-8">No data yet.</p>
          ) : (
            <div className="divide-y divide-outline-variant">
              {topPerformers.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-container transition-colors">
                  <span className={`font-bold text-sm w-6 text-center ${i < 3 ? 'text-primary' : 'text-on-surface-variant'}`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-on-surface truncate">{s.name}</p>
                    <p className="font-caption text-on-surface-variant">{s.tests} tests</p>
                  </div>
                  <span className={`font-bold text-sm ${s.avg >= 75 ? 'text-secondary' : s.avg >= 50 ? 'text-primary' : 'text-error'}`}>
                    {s.avg}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
