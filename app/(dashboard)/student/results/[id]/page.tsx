import React from 'react';
import { getTestResultDetails } from '@/app/actions/assessment';
import { testTotalPoints } from '@/lib/adaptive';
import QuestionReview from './QuestionReview';

export default async function TestResultsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const { test, score, attempts } = await getTestResultDetails(id);

  const totalQuestions = attempts?.length || 0;
  const correctCount = attempts?.filter(a => a.is_correct).length || 0;
  const incorrectCount = totalQuestions - correctCount;
  const simplePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const earnedPoints = testTotalPoints(
    (attempts ?? []).map(a => {
      const q: any = Array.isArray(a.questions) ? a.questions[0] : a.questions;
      return {
        difficulty: q?.difficulty ?? 3,
        isCorrect: !!a.is_correct,
        timeTakenMs: a.time_taken_ms ?? 0,
      };
    }),
  );
  
  // Calculate avg speed
  const totalTimeMs = attempts?.reduce((acc, curr) => acc + (curr.time_taken_ms || 0), 0) || 0;
  const avgTimeS = totalQuestions > 0 ? Math.floor(totalTimeMs / totalQuestions / 1000) : 0;
  const avgMins = Math.floor(avgTimeS / 60);
  const avgSecs = avgTimeS % 60;

  // Domain accuracy mapping
  const domainStats: Record<string, { correct: number, total: number }> = {};
  
  // Difficulty stats
  const difficultyStats: Record<number, { correct: number, total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
    4: { correct: 0, total: 0 },
    5: { correct: 0, total: 0 },
  };

  attempts?.forEach(a => {
    const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    if (q) {
      const domain = q.domain || 'GENERAL';
      if (!domainStats[domain]) domainStats[domain] = { correct: 0, total: 0 };
      domainStats[domain].total += 1;
      if (a.is_correct) domainStats[domain].correct += 1;

      const diff = q.difficulty || 1;
      if (difficultyStats[diff]) {
        difficultyStats[diff].total += 1;
        if (a.is_correct) difficultyStats[diff].correct += 1;
      }
    }
  });

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col">
      <main className="layout-container flex h-full grow flex-col px-margin-mobile md:px-margin-desktop py-8 max-w-container-max-width mx-auto w-full">
        {/* Page Heading */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant font-metric-label rounded-full text-xs">Test Complete</span>
                <span className="text-on-surface-variant font-caption">
                  Completed {new Date(test.completed_at || test.created_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="font-display-sm text-on-surface">Assessment Results: {score?.domain || 'Overall'}</h1>
              <p className="text-on-surface-variant font-body-lg">
                You answered {correctCount}/{totalQuestions} correctly ({simplePercent}%) and are in the {score?.percentile || 50}th percentile.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2 border border-outline text-on-surface font-metric-label rounded-lg hover:bg-surface-container transition-colors">
                Download PDF
              </button>
            </div>
          </div>

          {/* High Level Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl p-6 border border-outline-variant flex flex-col gap-2 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
              <p className="font-metric-label text-on-surface-variant uppercase">Overall Score</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-primary">{earnedPoints} pts</span>
                <span className="text-secondary font-metric-label bg-secondary-fixed px-2 py-1 rounded">
                  {simplePercent >= 70 ? 'Pass' : 'Needs Work'}
                </span>
              </div>
              <p className="font-caption text-on-surface-variant">{correctCount}/{totalQuestions} correct · {simplePercent}%</p>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-outline-variant flex flex-col gap-2 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
              <p className="font-metric-label text-on-surface-variant uppercase">Percentile Rank</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-on-surface">{score?.percentile || 50}th</span>
                <span className="text-on-surface-variant font-body-md">vs. Peer Group</span>
              </div>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-outline-variant flex flex-col gap-2 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
              <p className="font-metric-label text-on-surface-variant uppercase">Average Speed</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-on-surface">{avgMins}m {avgSecs}s</span>
                <span className="text-on-surface-variant font-body-md">per question</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary Section */}
        <section className="mb-12">
          <h2 className="font-headline-md text-on-surface mb-6">Performance Summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Domain Breakdown */}
            <div className="bg-surface rounded-xl p-8 border border-outline-variant">
              <h3 className="font-metric-label text-on-surface-variant uppercase mb-6">Accuracy by Domain</h3>
              <div className="flex flex-col gap-5">
                {Object.entries(domainStats).map(([domain, stats]) => {
                  const accuracy = Math.round((stats.correct / stats.total) * 100);
                  const isLow = accuracy < 70;
                  return (
                    <div key={domain} className="flex flex-col gap-2">
                      <div className="flex justify-between items-end">
                        <span className="font-body-md text-on-surface font-medium capitalize">{domain.toLowerCase()}</span>
                        <span className={`font-metric-label ${isLow ? 'text-error' : 'text-on-surface'}`}>{accuracy}%</span>
                      </div>
                      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                        <div className={`${isLow ? 'bg-error' : 'bg-secondary'} h-full rounded-full transition-all`} style={{ width: `${accuracy}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(domainStats).length === 0 && (
                  <p className="text-sm text-on-surface-variant">No domain data available.</p>
                )}
              </div>
            </div>

            {/* Difficulty Distribution Chart */}
            <div className="bg-surface rounded-xl p-8 border border-outline-variant flex flex-col">
              <h3 className="font-metric-label text-on-surface-variant uppercase mb-2">Difficulty Distribution</h3>
              <p className="font-body-md text-on-surface-variant mb-8">Performance across complexity levels.</p>
              <div className="flex-grow flex items-end justify-center gap-6 sm:gap-12 px-2 sm:px-6 h-[200px]">
                {[1, 2, 3, 4, 5].map(level => {
                  const stats = difficultyStats[level];
                  const hasQuestions = stats.total > 0;
                  const accuracy = hasQuestions ? Math.round((stats.correct / stats.total) * 100) : 0;
                  
                  return (
                    <div key={level} className="flex flex-col items-center gap-3 w-12 sm:w-16 h-full justify-end group">
                      <span className="font-metric-label text-on-surface opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasQuestions ? `${accuracy}%` : 'N/A'}
                      </span>
                      <div 
                        className={`w-full ${hasQuestions ? 'bg-primary-fixed hover:bg-primary-fixed-dim border-primary' : 'bg-surface-container border-outline-variant'} transition-colors rounded-t-sm border-t-2`} 
                        style={{ height: `${Math.max(accuracy, 5)}%` }}
                      ></div>
                      <span className="font-metric-label text-on-surface-variant">L{level}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Question Review & AI Insights */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="font-headline-md text-on-surface">Question Review & AI Insights</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 font-metric-label rounded-full text-xs flex items-center gap-1 ${incorrectCount > 0 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[14px]">{incorrectCount > 0 ? 'error' : 'check_circle'}</span> 
                {incorrectCount} Incorrect
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            {attempts?.map((attempt, idx) => (
              <QuestionReview key={attempt.id || idx} attempt={attempt} index={idx} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
