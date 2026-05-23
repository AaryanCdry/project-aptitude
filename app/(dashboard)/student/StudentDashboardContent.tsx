import React from 'react';
import Link from 'next/link';
import { getStudentDashboardData } from '@/app/actions/dashboard';
import { getStudentCohortData, getStudentAssignedAssessments } from '@/app/actions/cohorts';
import { getStudentFinalExams } from '@/app/actions/finals';
import { createAdminClient } from '@/lib/supabase/admin';
import PublicLearningPath from './PublicLearningPath';
import CollegeCurriculumCard from './CollegeCurriculumCard';
import AssignedAssessments from './AssignedAssessments';

const DOMAIN_CONFIG: Record<string, { icon: string; bg: string; textColor: string }> = {
  QUANTITATIVE: { icon: 'functions',     bg: 'bg-primary-fixed',    textColor: 'text-on-primary-fixed' },
  LOGICAL:      { icon: 'psychology',    bg: 'bg-secondary-fixed',  textColor: 'text-on-secondary-fixed' },
  VERBAL:       { icon: 'format_quote',  bg: 'bg-surface-container-high', textColor: 'text-on-surface' },
  REASONING:    { icon: 'visibility',    bg: 'bg-tertiary-fixed',   textColor: 'text-on-tertiary-fixed' },
  SPATIAL:      { icon: 'view_in_ar',    bg: 'bg-tertiary-fixed',   textColor: 'text-on-tertiary-fixed' },
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

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Principal',
  SUB_ADMIN: 'HOD',
  MENTOR: 'Mentor',
  SUPER_ADMIN: 'Super Admin',
};

export type ViewerMode = { role: string; backHref: string } | null;

interface Props {
  studentId: string;
  viewerMode?: ViewerMode;
}

export default async function StudentDashboardContent({ studentId, viewerMode = null }: Props) {
  const isViewer = !!viewerMode;

  // Per-role base path for the Insights → test-result drill-down. Each role
  // has its own results route so the surrounding layout (sidebar / header)
  // matches the caller, instead of forcing the student-portal shell.
  const resultsBase = viewerMode
    ? viewerMode.role === 'MENTOR' ? '/mentor/results'
    : '/admin/results'  // ADMIN / SUB_ADMIN / SUPER_ADMIN
    : '/student/results';

  // Parallel-fetch the four dashboard datasets + the student's profile row.
  const adminClient = createAdminClient();
  const [
    { tests, domainScores, averageScore, totalTests, scoreTrend, collegeId },
    cohortData,
    assignedAssessments,
    finalExams,
    { data: profile },
  ] = await Promise.all([
    getStudentDashboardData(studentId),
    getStudentCohortData(studentId),
    getStudentAssignedAssessments(studentId),
    getStudentFinalExams(studentId),
    adminClient.from('users').select('name, email, student_level, total_points').eq('id', studentId).single(),
  ]);

  const recentTests = tests.slice(0, 5);
  const pendingFinal = (finalExams as any[])[0] ?? null;
  const studentLevel: number = profile?.student_level ?? 0;
  const studentName = profile?.name ?? profile?.email ?? 'Student';

  // Score-trend SVG helpers
  const trendPoints = scoreTrend.length > 0 ? scoreTrend : [];
  const n = trendPoints.length;
  const svgPoints = trendPoints.map((p, i) => {
    const x = n === 1 ? 50 : 10 + (i / (n - 1)) * 80;
    const y = 100 - p.score;
    return { x, y, score: p.score, label: p.label };
  });
  const polyline = svgPoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = svgPoints.length > 0
    ? `M ${svgPoints[0].x},100 ` + svgPoints.map(p => `L ${p.x},${p.y}`).join(' ') + ` L ${svgPoints[svgPoints.length - 1].x},100 Z`
    : '';

  return (
    <>
      {isViewer && viewerMode && (
        <div className="sticky top-0 z-20 bg-tertiary-fixed/40 border-b border-tertiary px-margin-mobile lg:px-margin-desktop py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary">visibility</span>
            <p className="font-metric-label text-on-surface">
              Viewing <span className="font-semibold">{studentName}</span> as {ROLE_LABEL[viewerMode.role] ?? viewerMode.role}
            </p>
          </div>
          <Link
            href={viewerMode.backHref}
            className="inline-flex items-center gap-1 text-on-surface hover:underline font-metric-label text-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </Link>
        </div>
      )}

      <div className="p-margin-desktop overflow-y-auto">
        <div className="max-w-container-max-width mx-auto flex flex-col gap-gutter">

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className="relative bg-surface-container-lowest rounded-xl border border-outline-variant p-8 flex items-center justify-between overflow-hidden shadow-sm hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
            <div className="relative z-10 flex flex-col gap-4 max-w-lg">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed-dim text-on-primary-fixed text-xs font-metric-label">
                    <span className="material-symbols-outlined text-sm">military_tech</span>
                    Lvl {studentLevel}
                  </span>
                  {isViewer && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-metric-label">
                      <span className="material-symbols-outlined text-sm">monetization_on</span>
                      {(profile?.total_points ?? 0).toLocaleString()} Pts
                    </span>
                  )}
                </div>
                <h3 className="font-display-sm text-on-surface mb-2">
                  {isViewer ? `${studentName.split(' ')[0]}'s adaptive performance` : 'Ready for your next challenge?'}
                </h3>
                <p className="font-body-lg text-on-surface-variant">
                  {isViewer
                    ? 'A live view of this student’s cognitive profile, score trend, and recent activity.'
                    : 'Take an Adaptive Practice Test to recalibrate your baseline and improve your cognitive agility.'}
                </p>
              </div>
              {!isViewer && (
                <Link href="/assessment" className="bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-metric-label px-6 py-3 rounded-lg w-fit flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined">play_arrow</span>
                  Quick Start Assessment
                </Link>
              )}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-surface-container-low hidden md:flex items-center justify-center border-l border-outline-variant">
              <span className="material-symbols-outlined text-[120px] text-primary-fixed-dim opacity-20">model_training</span>
            </div>
          </section>

          {/* ── Final Exam (when one is scheduled / in progress) ──────────── */}
          {pendingFinal && (
            <section className="bg-tertiary-fixed/30 border border-tertiary rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-on-surface">
                    {pendingFinal.status === 'IN_PROGRESS' ? 'Final Exam in progress' : 'Final Exam scheduled'}
                  </h3>
                  <p className="font-body-md text-on-surface-variant">
                    {pendingFinal.scheduled_at
                      ? `Scheduled for ${new Date(pendingFinal.scheduled_at).toLocaleString()}. `
                      : ''}
                    Passing this exam (≥70%) earns a tiered certificate.
                  </p>
                </div>
              </div>
              {!isViewer && (
                <Link
                  href={`/assessment?test=${pendingFinal.id}`}
                  className="bg-tertiary text-on-tertiary font-metric-label px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-tertiary/90 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                  {pendingFinal.status === 'IN_PROGRESS' ? 'Resume Final Exam' : 'Start Final Exam'}
                </Link>
              )}
            </section>
          )}

          {/* ── Analytics Grid ────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

            {/* Cognitive Profile */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-headline-md text-on-surface">Cognitive Profile</h4>
              </div>
              <div className="flex-1 flex flex-col gap-6">
                {domainScores.length === 0 ? (
                  <div className="text-sm text-on-surface-variant text-center my-auto py-8">
                    {isViewer ? 'No test data yet for this student.' : 'Take a test to generate your cognitive profile.'}
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

            {/* Score Trend */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-headline-md text-on-surface">Score Trend</h4>
                <span className="font-caption text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                  Last {trendPoints.length} Tests
                </span>
              </div>
              {trendPoints.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant py-8">
                  {isViewer ? 'No completed tests yet.' : 'Complete tests to see your score trend.'}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-end relative h-48">
                  <div className="flex-1 flex gap-4 mt-2 h-48">
                    <div className="flex flex-col justify-between text-[10px] font-metric-label text-on-surface-variant pb-8 pt-2">
                      <span>100</span><span>50</span><span>0</span>
                    </div>
                    <div className="flex-1 flex flex-col relative">
                      <div className="absolute inset-0 flex flex-col justify-between pb-8">
                        <div className="w-full h-px bg-outline-variant opacity-30"></div>
                        <div className="w-full h-px bg-outline-variant opacity-30"></div>
                        <div className="w-full h-px bg-outline-variant opacity-30"></div>
                      </div>
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
                            <polyline points={polyline} fill="none" stroke="#3525cd" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex items-end justify-between px-[5%]">
                          {svgPoints.map((p) => (
                            <div key={p.label} className="relative group flex flex-col items-center" style={{ bottom: `calc(${p.score}% - 4px)` }}>
                              <div className="absolute -top-6 bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {p.score}%
                              </div>
                              <div className="size-2.5 bg-primary border-2 border-surface-container-lowest rounded-full shadow-sm ring-4 ring-primary/10"></div>
                            </div>
                          ))}
                        </div>
                      </div>
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
                ['Quantitative', 'Logical', 'Verbal', 'Reasoning'].map((name) => (
                  <div key={name} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm opacity-60">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-surface-container-high text-on-surface p-2 rounded-lg">
                        <span className="material-symbols-outlined text-xl">analytics</span>
                      </div>
                      <span className="bg-surface-container text-on-surface-variant text-xs font-metric-label px-2 py-1 rounded">No data</span>
                    </div>
                    <h5 className="font-metric-label text-on-surface mb-1">{name}</h5>
                    <p className="font-caption text-on-surface-variant mb-4">{isViewer ? 'No data yet' : 'Take a test to unlock'}</p>
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
                  const cta = isWeak ? 'Start Drill' : ds.average >= 90 ? 'Maintain Level' : 'Strengthen This';
                  return (
                    <div key={ds.domain} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col shadow-sm hover:border-primary transition-colors group">
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
                      {!isViewer && (
                        <div className="mt-auto">
                          <Link
                            href={`/assessment?domain=${ds.domain}`}
                            className="block w-full py-2 border border-outline text-on-surface font-metric-label text-sm rounded-lg text-center group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all"
                          >
                            {cta}
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ── Learning Path (public) or College Curriculum ─────────────── */}
          {collegeId
            ? <CollegeCurriculumCard cohort={cohortData as any} hideActions={isViewer} />
            : <PublicLearningPath averageScore={averageScore} />
          }

          {/* ── Assigned Assessments (college students only) ─────────────── */}
          {collegeId && <AssignedAssessments assignments={assignedAssessments as any} />}

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
                  {isViewer ? 'No recent activity for this student.' : 'No recent activity. Start an assessment to see your progress!'}
                </div>
              ) : (
                recentTests.map((test: any, index: number) => {
                  const score = test.overallScore ?? 0;
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
                        <Link href={`${resultsBase}/${test.id}`} className="text-primary text-sm font-metric-label hover:underline flex items-center gap-1">
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
