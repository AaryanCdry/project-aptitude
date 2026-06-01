import React from 'react';
import Link from 'next/link';
import { getStudentProgress } from '@/app/actions/progress';
import TestHistoryTabs from './TestHistoryTabs';

const DOMAIN_COLORS: Record<string, { bar: string; badge: string; text: string }> = {
  REASONING:    { bar: 'bg-primary',   badge: 'bg-primary-fixed-dim text-on-primary-fixed',               text: 'text-primary' },
  QUANTITATIVE: { bar: 'bg-secondary', badge: 'bg-secondary-fixed text-on-secondary-fixed-variant',        text: 'text-secondary' },
  LOGICAL:      { bar: 'bg-primary',   badge: 'bg-surface-container-high text-on-surface',                 text: 'text-primary' },
  VERBAL:       { bar: 'bg-tertiary',  badge: 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant',       text: 'text-tertiary' },
};

const LEVEL_LABELS = ['', 'Beginner', 'Developing', 'Intermediate', 'Advanced', 'Expert'];

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="font-caption text-on-surface-variant">No data</span>;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="text-primary" />
      <circle cx={pts.split(' ').pop()!.split(',')[0]} cy={pts.split(' ').pop()!.split(',')[1]} r="3" fill="currentColor" className="text-primary" />
    </svg>
  );
}

export default async function ProgressPage() {
  const data = await getStudentProgress();
  const { domainSummary, overallAvg, totalTests, testHistory } = data;

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display-sm text-display-sm text-on-background mb-2">My Progress</h1>
        <p className="font-body-md text-on-surface-variant">Track your domain mastery, level growth, and improvement over time.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tests Completed', value: totalTests, icon: 'task_alt', color: 'text-primary' },
          { label: 'Overall Avg Score', value: `${overallAvg}%`, icon: 'analytics', color: 'text-secondary' },
          { label: 'Domains Tracked', value: domainSummary.length, icon: 'radar', color: 'text-primary' },
          { label: 'Top Level Reached', value: domainSummary.length ? `L${Math.max(...domainSummary.map(d => d.level))}` : '—', icon: 'military_tech', color: 'text-tertiary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              <p className="font-caption text-on-surface-variant">{label}</p>
            </div>
            <p className="font-display-sm text-[28px] text-on-surface font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Domain Cards */}
      <h2 className="font-headline-md text-on-surface text-[18px] font-semibold mb-4">Domain Breakdown</h2>
      {domainSummary.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center mb-8">
          <span className="material-symbols-outlined text-4xl text-outline block mb-2">bar_chart</span>
          <p className="font-body-md text-on-surface-variant">Take your first test to see progress here.</p>
          <Link href="/assessment" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label">
            Start a Test
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {domainSummary.map((d) => {
            const colors = DOMAIN_COLORS[d.domain] ?? DOMAIN_COLORS.REASONING;
            return (
              <div key={d.domain} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
                {/* Domain header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                      {d.domain}
                    </span>
                    <p className="font-caption text-on-surface-variant mt-2">{LEVEL_LABELS[d.level]} · Level {d.level}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-display-sm text-[28px] font-bold ${colors.text}`}>{d.latest}%</p>
                    <p className={`font-caption ${d.delta >= 0 ? 'text-secondary' : 'text-error'} flex items-center justify-end gap-0.5`}>
                      <span className="material-symbols-outlined text-sm">{d.delta >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                      {Math.abs(d.delta)}% vs first test
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between font-caption text-on-surface-variant mb-1">
                    <span>Avg Score</span>
                    <span>{d.avg}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${d.avg}%` }} />
                  </div>
                </div>

                {/* Sparkline + Percentile */}
                <div className="flex items-center justify-between">
                  <div className={colors.text}>
                    <MiniSparkline values={d.history} />
                  </div>
                  <div className="text-right">
                    <p className="font-caption text-on-surface-variant">Avg Percentile</p>
                    <p className={`font-headline-md text-[18px] font-bold ${colors.text}`}>{d.avgPct}th</p>
                  </div>
                </div>

                {/* Level dots */}
                <div className="mt-4 flex items-center gap-1.5">
                  {[1,2,3,4,5].map(l => (
                    <div key={l} className={`h-1.5 flex-1 rounded-full transition-colors ${l <= d.level ? colors.bar : 'bg-surface-container-high'}`} />
                  ))}
                  <span className="font-caption text-on-surface-variant ml-2">L{d.level}/5</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Test History with type tabs */}
      <h2 className="font-headline-md text-on-surface text-[18px] font-semibold mb-4">Test History</h2>
      <TestHistoryTabs tests={testHistory} />
    </div>
  );
}
