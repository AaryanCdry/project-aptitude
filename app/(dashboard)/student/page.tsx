import React from 'react';
import Link from 'next/link';
import { getStudentDashboardData } from '@/app/actions/dashboard';

// Helper: map domain name → icon & color scheme
const DOMAIN_CONFIG: Record<string, { icon: string; bg: string; textColor: string }> = {
  QUANTITATIVE: { icon: 'functions',     bg: 'bg-primary-fixed',    textColor: 'text-on-primary-fixed' },
  LOGICAL:      { icon: 'psychology',    bg: 'bg-secondary-fixed',  textColor: 'text-on-secondary-fixed' },
  VERBAL:       { icon: 'format_quote',  bg: 'bg-surface-container-high', textColor: 'text-on-surface' },
  REASONING:    { icon: 'visibility',    bg: 'bg-tertiary-fixed',   textColor: 'text-on-tertiary-fixed' },
};

const RING_COLORS = [
  'border-t-primary',
  'border-t-secondary border-r-secondary',
  'border-t-primary border-r-primary border-b-primary',
  'border-t-secondary',
];

const BAR_COLORS = ['bg-primary', 'bg-secondary', 'bg-primary/60', 'bg-secondary/60'];

function getLevel(avg: number): { label: string; badge: string } {
  if (avg >= 90) return { label: 'Lvl 5: Master',   badge: 'bg-surface-container text-on-surface' };
  if (avg >= 75) return { label: 'Lvl 4: Expert',   badge: 'bg-surface-container text-on-surface' };
  if (avg >= 60) return { label: 'Lvl 3: Advanced', badge: 'bg-surface-container text-on-surface' };
  if (avg >= 40) return { label: 'Lvl 2: Novice',   badge: 'bg-error-container text-on-error-container' };
  return           { label: 'Lvl 1: Beginner',      badge: 'bg-error-container text-on-error-container' };
}

function getPercentileLabel(avg: number): string {
  if (avg >= 90) return 'Top 5% percentile';
  if (avg >= 80) return 'Top 15% percentile';
  if (avg >= 70) return 'Top 30% percentile';
  if (avg >= 60) return 'Top 50% percentile';
  return 'Focus area required';
}

export default async function StudentDashboard() {
  const { tests, domainScores, averageScore, totalTests, scoreTrend } = await getStudentDashboardData();
  const recentTests = tests.slice(0, 5);

  // ── Score Trend SVG helpers ──────────────────────────────────────────────
  // We build an SVG polyline in a 100×100 viewBox. Y is inverted (0 = top).
  const trendPoints = scoreTrend.length > 0 ? scoreTrend : [];
  const n = trendPoints.length;
  const svgPoints = trendPoints.map((p, i) => {
    const x = n === 1 ? 50 : 10 + (i / (n - 1)) * 80;
    const y = 100 - p.score; // score 0→bottom, 100→top
    return { x, y, score: p.score, label: p.label };
  });
  const polyline = svgPoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = svgPoints.length > 0
    ? `M ${svgPoints[0].x},100 ` +
      svgPoints.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${svgPoints[svgPoints.length - 1].x},100 Z`
    : '';

  return (
    <>
      <div className="p-margin-desktop overflow-y-auto">
        <div className="max-w-container-max-width mx-auto flex flex-col gap-gutter">

          {/* ── Hero CTA ─────────────────────────────────────────────────── */}
          <section className="relative bg-surface-container-lowest rounded-xl border border-outline-variant p-8 flex items-center justify-between overflow-hidden shadow-sm hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
            <div className="relative z-10 flex flex-col gap-4 max-w-lg">
              <div>
                <h3 className="font-display-sm text-on-surface mb-2">Ready for your next challenge?</h3>
                <p className="font-body-lg text-on-surface-variant">
                  Take an Adaptive Practice Test to recalibrate your baseline and improve your cognitive agility.
                </p>
              </div>
              <Link href="/assessment" className="bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-metric-label px-6 py-3 rounded-lg w-fit flex items-center gap-2 transition-colors">
                <span className="material-symbols-outlined">play_arrow</span>
                Quick Start Assessment
              </Link>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-surface-container-low hidden md:flex items-center justify-center border-l border-outline-variant">
              <span className="material-symbols-outlined text-[120px] text-primary-fixed-dim opacity-20">model_training</span>
            </div>
          </section>

          {/* ── Analytics Grid ────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

            {/* Cognitive Profile */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-headline-md text-on-surface">Cognitive Profile</h4>
                <button className="text-primary text-sm font-metric-label hover:underline">Details</button>
              </div>
              <div className="flex-1 flex flex-col gap-6">
                {domainScores.length === 0 ? (
                  <div className="text-sm text-on-surface-variant text-center my-auto py-8">
                    Take a test to generate your cognitive profile.
                  </div>
                ) : (
                  domainScores.map((ds: any, idx: number) => (
                    <div key={ds.domain} className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full border-4 border-surface-container-high ${RING_COLORS[idx % RING_COLORS.length]} flex items-center justify-center`}>
                        <span className="font-metric-label text-on-surface">{ds.average}%</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-metric-label text-on-surface mb-1 capitalize">
                          {ds.domain.charAt(0) + ds.domain.slice(1).toLowerCase()}
                        </p>
                        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className={`${BAR_COLORS[idx % BAR_COLORS.length]} h-full rounded-full`} style={{ width: `${ds.average}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Score Trend — dynamic SVG */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-headline-md text-on-surface">Score Trend</h4>
                <span className="font-caption text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                  Last {trendPoints.length} Tests
                </span>
              </div>

              {trendPoints.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant py-8">
                  Complete tests to see your score trend.
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-end relative h-48">
                  <div className="flex-1 flex gap-4 mt-2 h-48">
                    {/* Y-axis labels */}
                    <div className="flex flex-col justify-between text-[10px] font-metric-label text-on-surface-variant pb-8 pt-2">
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                    {/* Chart area */}
                    <div className="flex-1 flex flex-col relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pb-8">
                        <div className="w-full h-px bg-outline-variant opacity-30"></div>
                        <div className="w-full h-px bg-outline-variant opacity-30"></div>
                        <div className="w-full h-px bg-outline-variant opacity-30"></div>
                      </div>
                      {/* SVG */}
                      <div className="relative flex-1">
                        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <defs>
                            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#3525cd" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#3525cd" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}
                          {polyline && (
                            <polyline
                              points={polyline}
                              fill="none"
                              stroke="#3525cd"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                            />
                          )}
                        </svg>
                        {/* Hover dots */}
                        <div className="absolute inset-0 flex items-end justify-between px-[5%]">
                          {svgPoints.map((p) => (
                            <div
                              key={p.label}
                              className="relative group flex flex-col items-center"
                              style={{ bottom: `calc(${p.score}% - 4px)` }}
                            >
                              <div className="absolute -top-6 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {p.score}%
                              </div>
                              <div className="size-2.5 bg-primary border-2 border-surface-container-lowest rounded-full shadow-sm ring-4 ring-primary/10"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* X-axis labels */}
                      <div className="flex justify-between border-t border-outline-variant pt-2 mt-auto px-[0%]">
                        {trendPoints.map((p, i) => (
                          <span key={p.label} className={`font-caption w-1/${n} text-center ${i === n - 1 ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                            {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Domain Mastery Cards ──────────────────────────────────────── */}
          <section>
            <h4 className="font-headline-md text-on-surface mb-4">Domain Mastery</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {domainScores.length === 0 ? (
                // Placeholder cards when no data
                ['Quantitative', 'Logical', 'Verbal', 'Reasoning'].map((name) => (
                  <div key={name} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm opacity-60">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-surface-container-high text-on-surface p-2 rounded-lg">
                        <span className="material-symbols-outlined text-xl">analytics</span>
                      </div>
                      <span className="bg-surface-container text-on-surface-variant text-xs font-metric-label px-2 py-1 rounded">No data</span>
                    </div>
                    <h5 className="font-metric-label text-on-surface mb-1">{name}</h5>
                    <p className="font-caption text-on-surface-variant mb-4">Take a test to unlock</p>
                    <div className="mt-auto">
                      <button className="w-full py-2 bg-surface border border-outline text-on-surface-variant font-metric-label text-sm rounded-lg cursor-default" disabled>
                        Locked
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                domainScores.map((ds: any) => {
                  const cfg = DOMAIN_CONFIG[ds.domain] ?? { icon: 'analytics', bg: 'bg-surface-container-high', textColor: 'text-on-surface' };
                  const { label, badge } = getLevel(ds.average);
                  const percentileLabel = getPercentileLabel(ds.average);
                  const isWeak = ds.average < 60;
                  return (
                    <div key={ds.domain} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm hover:border-primary transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`${cfg.bg} ${cfg.textColor} p-2 rounded-lg`}>
                          <span className="material-symbols-outlined text-xl">{cfg.icon}</span>
                        </div>
                        <span className={`${badge} text-xs font-metric-label px-2 py-1 rounded`}>{label}</span>
                      </div>
                      <h5 className="font-metric-label text-on-surface mb-1 capitalize">
                        {ds.domain.charAt(0) + ds.domain.slice(1).toLowerCase()}
                      </h5>
                      <p className="font-caption text-on-surface-variant mb-4">{percentileLabel}</p>
                      <div className="mt-auto">
                        <button className="w-full py-2 border border-outline text-on-surface font-metric-label text-sm rounded-lg group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all">
                          {isWeak ? 'Start Drill' : ds.average >= 90 ? 'Maintain Level' : 'Strengthen This'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ── Recent Activity ───────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-headline-md text-on-surface">Recent Activity</h4>
              {totalTests > 0 && (
                <span className="font-caption text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  {totalTests} tests total · Avg {averageScore}%
                </span>
              )}
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              {recentTests.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant font-body-md">
                  No recent activity. Start an assessment to see your progress!
                </div>
              ) : (
                recentTests.map((test: any, index: number) => {
                  const score = test.scores?.[0]?.score ?? 0;
                  const isPass = score >= 70;
                  const passLabel = score >= 85 ? 'High Pass' : isPass ? 'Pass' : 'Needs Work';

                  return (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between p-4 hover:bg-surface-container transition-colors ${index < recentTests.length - 1 ? 'border-b border-outline-variant' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-surface-container-high p-2 rounded-full text-on-surface">
                          <span className="material-symbols-outlined">{test.type === 'SELF' ? 'quiz' : 'assignment'}</span>
                        </div>
                        <div>
                          <p className="font-metric-label text-on-surface">Adaptive Mock Test</p>
                          <p className="font-caption text-on-surface-variant">
                            Completed {new Date(test.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="font-metric-label text-on-surface">{score}%</p>
                          <p className={`font-caption ${isPass ? 'text-secondary' : 'text-error'}`}>{passLabel}</p>
                        </div>
                        <Link href={`/student/results/${test.id}`} className="text-primary text-sm font-metric-label hover:underline flex items-center gap-1">
                          Insights <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
