import React from 'react';
import { getLeaderboard } from '@/app/actions/progress';
import { getInitials } from '@/lib/utils';

const MEDAL: Record<number, { icon: string; color: string }> = {
  1: { icon: 'emoji_events', color: 'text-[#f59e0b]' },
  2: { icon: 'military_tech', color: 'text-[#94a3b8]' },
  3: { icon: 'workspace_premium', color: 'text-[#cd7f32]' },
};

const GRADE = (score: number) => {
  if (score >= 85) return { label: 'Excellent', cls: 'bg-secondary-fixed text-on-secondary-fixed-variant' };
  if (score >= 70) return { label: 'Above Avg', cls: 'bg-primary-fixed-dim text-on-primary-fixed' };
  if (score >= 55) return { label: 'Average', cls: 'bg-surface-container-high text-on-surface' };
  return { label: 'Below Avg', cls: 'bg-error-container text-error' };
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const activePeriod = (period === 'weekly' || period === 'monthly') ? period : 'all';

  const { ranked, currentUserRank } = await getLeaderboard(activePeriod as any);

  const periods = [
    { key: 'all', label: 'All Time' },
    { key: 'monthly', label: 'This Month' },
    { key: 'weekly', label: 'This Week' },
  ];

  return (
    <div className="max-w-215 mx-auto pb-24">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-background mb-2">Leaderboard</h1>
          <p className="font-body-md text-on-surface-variant">See how you rank against your peers across all domains.</p>
        </div>
        {/* Period tabs */}
        <div className="flex gap-1 p-1 bg-surface-container-low border border-outline-variant rounded-lg">
          {periods.map(({ key, label }) => (
            <a
              key={key}
              href={`?period=${key}`}
              className={`px-4 py-2 rounded-md font-metric-label text-metric-label transition-colors ${activePeriod === key ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/50' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Your rank card */}
      {currentUserRank && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-on-primary text-lg">
              #{currentUserRank.rank}
            </div>
            <div>
              <p className="font-metric-label text-on-surface-variant uppercase text-[11px] tracking-widest">Your Rank</p>
              <p className="font-headline-md text-on-surface text-[20px] font-bold">
                {currentUserRank.rank} of {ranked.length}
              </p>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="font-caption text-on-surface-variant">Avg Score</p>
              <p className="font-headline-md text-[22px] text-primary font-bold">{currentUserRank.avgScore}%</p>
            </div>
            <div className="text-center">
              <p className="font-caption text-on-surface-variant">Avg Percentile</p>
              <p className="font-headline-md text-[22px] text-secondary font-bold">{currentUserRank.avgPercentile}th</p>
            </div>
            <div className="text-center">
              <p className="font-caption text-on-surface-variant">Tests</p>
              <p className="font-headline-md text-[22px] text-on-surface font-bold">{currentUserRank.testsCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {ranked.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[ranked[1], ranked[0], ranked[2]].map((entry, podiumIdx) => {
            if (!entry) return null;
            const heights = ['h-28', 'h-36', 'h-24'];
            const medal = MEDAL[entry.rank] ?? { icon: 'person', color: 'text-outline' };
            const initials = getInitials(entry.name);
            return (
              <div key={entry.id} className={`flex flex-col items-center justify-end ${podiumIdx === 1 ? 'order-2' : podiumIdx === 0 ? 'order-1' : 'order-3'}`}>
                <div className="mb-2 text-center">
                  <div className={`w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface mx-auto mb-1 border-2 ${entry.isCurrentUser ? 'border-primary' : 'border-outline-variant'}`}>
                    {initials}
                  </div>
                  <p className="font-body-md font-semibold text-on-surface text-center truncate max-w-25">{entry.name}</p>
                  <p className="font-caption text-primary">{entry.avgScore}%</p>
                </div>
                <div className={`w-full bg-surface-container-low border border-outline-variant rounded-t-lg ${heights[podiumIdx]} flex flex-col items-center justify-center`}>
                  <span className={`material-symbols-outlined text-2xl ${medal.color}`} style={{ fontVariationSettings: '"FILL" 1' }}>{medal.icon}</span>
                  <span className={`font-bold text-[20px] ${medal.color}`}>#{entry.rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <p className="font-metric-label text-on-surface">{ranked.length} participants</p>
          <p className="font-caption text-on-surface-variant capitalize">{activePeriod === 'all' ? 'All time' : `This ${activePeriod}`}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright">
                {['Rank', 'Student', 'Tests', 'Avg Score', 'Percentile', 'Grade'].map(h => (
                  <th key={h} className="py-3 px-5 font-metric-label text-metric-label text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {ranked.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-outline">leaderboard</span>
                    No data for this period yet.
                  </td>
                </tr>
              ) : ranked.map((entry) => {
                const medal = MEDAL[entry.rank];
                const grade = GRADE(entry.avgScore);
                const initials = getInitials(entry.name);
                return (
                  <tr key={entry.id} className={`transition-colors ${entry.isCurrentUser ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-surface-container'}`}>
                    <td className="py-3 px-5">
                      {medal ? (
                        <span className={`material-symbols-outlined text-xl ${medal.color}`} style={{ fontVariationSettings: '"FILL" 1' }}>{medal.icon}</span>
                      ) : (
                        <span className="font-body-md text-on-surface-variant">#{entry.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${entry.isCurrentUser ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                          {initials}
                        </div>
                        <div>
                          <p className={`font-body-md font-semibold ${entry.isCurrentUser ? 'text-primary' : 'text-on-surface'}`}>
                            {entry.isCurrentUser ? 'You' : entry.name}
                          </p>
                          {entry.isCurrentUser && <p className="font-caption text-primary/70">Your position</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-body-md text-on-surface-variant">{entry.testsCount}</td>
                    <td className="py-3 px-5">
                      <span className={`font-body-md font-bold ${entry.avgScore >= 75 ? 'text-secondary' : entry.avgScore >= 50 ? 'text-primary' : 'text-error'}`}>
                        {entry.avgScore}%
                      </span>
                    </td>
                    <td className="py-3 px-5 font-body-md text-on-surface-variant">{entry.avgPercentile}th</td>
                    <td className="py-3 px-5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${grade.cls}`}>{grade.label}</span>
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
