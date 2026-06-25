import Link from 'next/link';
import { getSjtResultDetails } from '@/app/actions/sjt';

const CATEGORY_LABELS: Record<string, string> = {
  TEAMWORK: 'Teamwork',
  COMMUNICATION: 'Communication',
  LEADERSHIP: 'Leadership',
  PROBLEM_SOLVING: 'Problem Solving',
  ADAPTABILITY: 'Adaptability',
};

export default async function SjtResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { test, competencyProfile } = await getSjtResultDetails(id);

  const testDate = new Date(test.completed_at ?? test.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const totalRaw = competencyProfile.reduce((s, c) => s + c.rawScore, 0);
  const totalMax = competencyProfile.reduce((s, c) => s + c.maxScore, 0);
  const overallPct = totalMax > 0 ? Math.round((totalRaw / totalMax) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/student/assessments"
        className="inline-flex items-center gap-1.5 text-on-surface-variant text-sm font-metric-label hover:text-primary transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        All Assessments
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>cases</span>
          <h1 className="font-headline-lg text-on-surface text-2xl font-bold">SJT Competency Results</h1>
        </div>
        <p className="font-caption text-on-surface-variant">Completed {testDate}</p>
      </div>

      {/* Overall score */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mb-5 flex items-center gap-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-surface-container" strokeWidth="3.5" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="currentColor" className="text-tertiary"
              strokeWidth="3.5"
              strokeDasharray={`${overallPct} ${100 - overallPct}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-bold text-on-surface text-lg">{overallPct}%</span>
        </div>
        <div>
          <p className="font-metric-label text-on-surface font-semibold">Overall Score</p>
          <p className="font-body-md text-on-surface-variant text-sm mt-0.5">
            {totalRaw} out of {totalMax} points across {competencyProfile.length} competency area{competencyProfile.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Competency grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {competencyProfile.map(({ category, rawScore, maxScore, percentile }) => {
          const pct = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
          const isDevelop = pct < 50;
          return (
            <div key={category} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="font-metric-label text-on-surface text-sm font-semibold">{CATEGORY_LABELS[category] ?? category}</p>
                <span className={`text-xs font-metric-label px-2 py-0.5 rounded-full ${isDevelop ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                  {isDevelop ? 'Develop' : 'Strong'}
                </span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden mb-2">
                <div
                  className={`h-2 rounded-full ${isDevelop ? 'bg-error' : 'bg-tertiary'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-on-surface-variant font-caption">
                <span>{pct}%</span>
                <span>P{percentile}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-tertiary/5 border border-tertiary/20 rounded-xl px-5 py-4 text-sm text-on-surface-variant font-body-md">
        Scores reflect how closely your responses matched expert consensus. Areas labelled <span className="font-semibold text-error">Develop</span> are opportunities to build stronger workplace judgement.
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/assessment/sjt"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-tertiary text-on-tertiary rounded-xl font-metric-label text-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Retake Assessment
        </Link>
        <Link
          href="/student/assessments"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-outline-variant text-on-surface-variant rounded-xl font-metric-label text-sm hover:bg-surface-container transition-colors"
        >
          All Assessments
        </Link>
      </div>
    </div>
  );
}
