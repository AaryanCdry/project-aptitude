'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchNextQuestion, submitAnswer, updateAnswer, finishTest } from '../actions/assessment';
import { createProctorSession, applyEvent, buildLogPayload, submitProctoringLog } from '@/lib/proctor';
import { gradeDifficulty, DIFFICULTY_BAND_STYLES } from '@/lib/adaptive';
import { useRouter } from 'next/navigation';

interface AssessmentClientProps {
  testId: string;
  domainFilter?: string | null;
}

export default function AssessmentClient({ testId, domainFilter = null }: AssessmentClientProps) {
  const router = useRouter();

  // Forward question state
  const [question, setQuestion] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(25);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testFinished, setTestFinished] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Navigation & tracking
  const [history, setHistory] = useState<Record<number, { question: any }>>({});
  const [skippedPositions, setSkippedPositions] = useState<Set<number>>(new Set());
  const [markedPositions, setMarkedPositions] = useState<Set<number>>(new Set());
  const [jumpToPos, setJumpToPos] = useState<number | null>(null); // null = forward mode
  const [allAttemptsComplete, setAllAttemptsComplete] = useState(false);
  const [showFinishWarning, setShowFinishWarning] = useState(false);

  // Timer — overall countdown for the entire test
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const questionStartRef = useRef<number>(Date.now());
  const isFinishingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionRef = useRef<any>(null);
  const jumpToPosRef = useRef<number | null>(null);
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { jumpToPosRef.current = jumpToPos; }, [jumpToPos]);

  // Proctoring
  const proctorRef = useRef(createProctorSession(testId));
  const questionTimingsRef = useRef<number[]>([]);

  // Derived
  const displayedQuestion = jumpToPos !== null ? history[jumpToPos]?.question : question;
  const displayedPosition = jumpToPos !== null ? jumpToPos : (progress + 1);
  const isCurrentMarked = markedPositions.has(displayedPosition);
  const isReviewing = jumpToPos !== null;

  useEffect(() => {
    loadNextQuestion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === 'hidden')
        proctorRef.current = applyEvent(proctorRef.current, { type: 'VISIBILITY_HIDDEN' });
    };
    const onBlur = () => {
      proctorRef.current = applyEvent(proctorRef.current, { type: 'FOCUS_LOST' });
    };
    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Overall test countdown — starts when expiresAt is first received, auto-finishes test on expiry
  useEffect(() => {
    if (!expiresAt) return;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

    const computeRemaining = () =>
      Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

    setTimeLeft(computeRemaining());

    intervalRef.current = setInterval(() => {
      const remaining = computeRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0 && !isFinishingRef.current) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        isFinishingRef.current = true;
        setTestFinished(true);
        finishTest(testId)
          .then(res => {
            setScore(res.score);
            const timings = questionTimingsRef.current;
            const avgTimeMs = timings.length > 0
              ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length)
              : 0;
            submitProctoringLog(buildLogPayload(proctorRef.current, avgTimeMs)).catch(console.error);
          })
          .catch(console.error);
      }
    }, 1000);

    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const loadNextQuestion = async () => {
    setLoading(true);
    setJumpToPos(null);
    try {
      const res = await fetchNextQuestion(testId, domainFilter);
      if (res.finished) {
        setAllAttemptsComplete(true);
      } else {
        const newPos = (res.progress ?? 0) + 1;
        setQuestion(res.question);
        setHistory(prev => ({ ...prev, [newPos]: { question: res.question } }));
        setProgress(res.progress || 0);
        setTotal(res.total || 25);
        if ((res as any).expiresAt) setExpiresAt((res as any).expiresAt);
        questionStartRef.current = Date.now();
        setSelectedOption(null);
      }
    } catch (err) {
      console.error('Failed to load question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTest = async () => {
    setTestFinished(true);
    setShowFinishWarning(false);
    const res = await finishTest(testId);
    setScore(res.score);
    const timings = questionTimingsRef.current;
    const avgTimeMs = timings.length > 0
      ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length)
      : 0;
    submitProctoringLog(buildLogPayload(proctorRef.current, avgTimeMs)).catch(console.error);
  };

  const handleSubmit = async () => {
    if (!selectedOption || !displayedQuestion) return;
    setIsSubmitting(true);
    try {
      const elapsed = Date.now() - questionStartRef.current;
      questionStartRef.current = Date.now();
      questionTimingsRef.current.push(elapsed);
      if (isReviewing && jumpToPos !== null) {
        await updateAnswer(testId, displayedQuestion.id, selectedOption, elapsed);
        setSkippedPositions(prev => { const n = new Set(prev); n.delete(jumpToPos); return n; });
        setMarkedPositions(prev => { const n = new Set(prev); n.delete(jumpToPos); return n; });
        setJumpToPos(null);
        setSelectedOption(null);
      } else {
        await submitAnswer(testId, displayedQuestion.id, selectedOption, elapsed);
        await loadNextQuestion();
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!question || isReviewing) return;
    setIsSubmitting(true);
    try {
      const currentPos = progress + 1;
      const elapsed = Date.now() - questionStartRef.current;
      questionStartRef.current = Date.now();
      questionTimingsRef.current.push(elapsed);
      await submitAnswer(testId, question.id, '__SKIP__', elapsed);
      setSkippedPositions(prev => { const n = new Set(prev); n.add(currentPos); return n; });
      await loadNextQuestion();
    } catch (err) {
      console.error('Failed to skip question:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkForReview = () => {
    if (!displayedQuestion) return;
    setMarkedPositions(prev => {
      const next = new Set(prev);
      if (next.has(displayedPosition)) next.delete(displayedPosition);
      else next.add(displayedPosition);
      return next;
    });
  };

  const handleJumpToQuestion = (pos: number) => {
    if (!history[pos]) return;
    setSelectedOption(null);
    setJumpToPos(pos);
  };

  const handleTryFinish = () => {
    if (skippedPositions.size > 0 || markedPositions.size > 0) {
      setShowFinishWarning(true);
    } else {
      handleFinishTest();
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading && !allAttemptsComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Test finished (score screen) ─────────────────────────────────────────────
  if (testFinished) {
    return (
      <div className="min-h-screen bg-surface-container-lowest p-6 md:p-10 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface-container rounded-xl p-8 text-center border border-outline-variant shadow-lg mb-8">
            <span className="material-symbols-outlined text-6xl text-primary mb-4">task_alt</span>
            <h1 className="font-headline-md text-2xl mb-2 text-on-surface">Test Completed!</h1>
            <p className="font-body-md text-on-surface-variant mb-6">Your adaptive assessment is finished. Review your performance below.</p>
            <div className="bg-surface-container-highest p-6 rounded-lg mb-8 max-w-sm mx-auto">
              <p className="font-metric-label text-sm text-on-surface-variant mb-1">Final Score</p>
              <p className="font-headline-lg text-4xl text-primary">{score}%</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/student')}
                className="bg-surface border border-outline text-on-surface font-metric-label py-3 px-8 rounded-lg hover:bg-surface-container transition-colors w-full sm:w-auto"
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => router.push(`/student/results/${testId}`)}
                className="bg-primary text-on-primary font-metric-label py-3 px-8 rounded-lg hover:bg-primary/90 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2"
              >
                View Detailed Results
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Review screen (all 25 attempted, not yet jumping to a question) ──────────
  if (allAttemptsComplete && !isReviewing) {
    const skippedArr = [...skippedPositions].sort((a, b) => a - b);
    const markedArr = [...markedPositions].filter(p => !skippedPositions.has(p)).sort((a, b) => a - b);
    const totalPending = skippedArr.length + markedArr.length;

    return (
      <div className="min-h-screen bg-surface-container-lowest p-6 md:p-10 pb-24">
        <div className="max-w-3xl mx-auto">

          {/* Header card */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant shadow-sm mb-6 text-center">
            <span className="material-symbols-outlined text-4xl text-secondary mb-3 block">checklist</span>
            <h1 className="font-headline-md text-xl text-on-surface mb-1">All Questions Attempted</h1>
            <p className="font-body-md text-on-surface-variant">
              {totalPending > 0
                ? `${skippedArr.length > 0 ? `${skippedArr.length} skipped` : ''}${skippedArr.length > 0 && markedArr.length > 0 ? ' and ' : ''}${markedArr.length > 0 ? `${markedArr.length} marked for review` : ''}. Review them before submitting.`
                : 'All questions answered. You\'re ready to submit.'}
            </p>
          </div>

          {/* Skipped */}
          {skippedArr.length > 0 && (
            <div className="bg-surface-container rounded-xl border border-outline-variant shadow-sm mb-4 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant bg-error-container/20">
                <span className="material-symbols-outlined text-error text-[20px]">skip_next</span>
                <span className="font-metric-label text-on-surface">{skippedArr.length} Skipped Question{skippedArr.length > 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-outline-variant">
                {skippedArr.map(pos => (
                  <button
                    key={pos}
                    onClick={() => handleJumpToQuestion(pos)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="font-body-md text-on-surface">Question {pos}</span>
                    <div className="flex items-center gap-1.5 text-primary font-metric-label text-sm">
                      Answer now <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Marked for review */}
          {markedArr.length > 0 && (
            <div className="bg-surface-container rounded-xl border border-outline-variant shadow-sm mb-4 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant bg-tertiary/10">
                <span className="material-symbols-outlined text-tertiary text-[20px]">flag</span>
                <span className="font-metric-label text-on-surface">{markedArr.length} Marked for Review</span>
              </div>
              <div className="divide-y divide-outline-variant">
                {markedArr.map(pos => (
                  <button
                    key={pos}
                    onClick={() => handleJumpToQuestion(pos)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="font-body-md text-on-surface">Question {pos}</span>
                    <div className="flex items-center gap-1.5 text-primary font-metric-label text-sm">
                      Review <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Finish */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleTryFinish}
              className="px-8 py-3 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              {totalPending > 0 ? `Submit Anyway (${totalPending} pending)` : 'Submit Test'}
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>

        {/* Warning modal */}
        {showFinishWarning && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container rounded-2xl border border-outline-variant shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <h2 className="font-headline-md text-on-surface text-lg">Submit Test?</h2>
              </div>
              <p className="font-body-md text-on-surface-variant mb-6">
                {skippedPositions.size > 0 && (
                  <span>You have <strong className="text-on-surface">{skippedPositions.size} skipped question{skippedPositions.size > 1 ? 's' : ''}</strong> that will be marked as incorrect. </span>
                )}
                {markedPositions.size > 0 && (
                  <span>You have <strong className="text-on-surface">{markedPositions.size} question{markedPositions.size > 1 ? 's' : ''}</strong> marked for review. </span>
                )}
                Are you sure you want to submit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishWarning(false)}
                  className="flex-1 px-4 py-3 rounded-lg border border-outline-variant text-on-surface font-metric-label hover:bg-surface-container-high transition-colors"
                >
                  Continue Reviewing
                </button>
                <button
                  onClick={handleFinishTest}
                  className="flex-1 px-4 py-3 rounded-lg bg-error text-on-error font-metric-label hover:bg-error/90 transition-colors"
                >
                  Submit Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!displayedQuestion) return null;

  const currentQuestionNumber = progress + 1;
  const progressPercent = Math.round((currentQuestionNumber / total) * 100);

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface-container-lowest border-b border-outline-variant px-margin-mobile lg:px-margin-desktop py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={() => router.push('/student')}
            aria-label="Exit Exam"
            className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div>
            <h2 className="font-metric-label text-primary uppercase tracking-wider text-xs">
              {isReviewing ? 'Review Mode' : 'Exam Mode'}
            </h2>
            <h1 className="font-headline-md text-on-surface text-lg md:text-xl truncate max-w-62.5 md:max-w-md">
              {displayedQuestion.domain || 'Adaptive Test'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="hidden md:flex flex-col gap-1 w-48">
            <div className="flex justify-between items-center text-sm">
              <span className="font-metric-label text-on-surface">
                {isReviewing ? `Reviewing Q${jumpToPos}` : `Question ${currentQuestionNumber} of ${total}`}
              </span>
              <span className="font-metric-label text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-metric-label transition-colors ${timeLeft <= 300 ? 'bg-error-container border-error text-on-error-container' : 'bg-surface-container-low border-outline-variant text-on-surface'}`}>
            <span className="material-symbols-outlined text-sm">timer</span>
            <span className="text-lg tabular-nums">
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
      </header>

      <main className="grow flex justify-center py-margin-desktop px-margin-mobile pb-24 md:pb-margin-desktop">
        <div className="w-full max-w-container-max-width flex flex-col lg:flex-row gap-gutter items-start">

          <div key={displayedQuestion.id} className="animate-slide-up grow w-full max-w-assessment-max-width bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-10 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]">

            {/* Review mode banner */}
            {isReviewing && (
              <div className="mb-5 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tertiary/10 border border-tertiary/30">
                <span className="material-symbols-outlined text-tertiary text-[18px]">edit</span>
                <span className="font-metric-label text-tertiary text-sm">
                  Revisiting Question {jumpToPos}. Select an answer to update your response.
                </span>
                <button
                  onClick={() => { setJumpToPos(null); setSelectedOption(null); }}
                  className="ml-auto text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-3 py-1 bg-surface-container rounded-full text-primary font-metric-label text-xs">
                  Question {displayedPosition} · Lvl {displayedQuestion.difficulty}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full font-metric-label text-xs ${DIFFICULTY_BAND_STYLES[gradeDifficulty(displayedQuestion.difficulty ?? 3)]}`}>
                  {gradeDifficulty(displayedQuestion.difficulty ?? 3)}
                </span>
              </div>
              {displayedQuestion.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low">
                  <img
                    src={displayedQuestion.image_url}
                    alt="Question diagram"
                    className="max-h-64 w-full object-contain p-3"
                  />
                </div>
              )}

              <p className="font-question-text text-on-surface text-lg leading-relaxed">
                {displayedQuestion.text}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {Array.isArray(displayedQuestion.options) && displayedQuestion.options.map((optionText: string, index: number) => {
                const isSelected = selectedOption === optionText;
                const key = String.fromCharCode(65 + index);
                const optImg = displayedQuestion.options_images?.[index] ?? null;
                return (
                  <label key={index} className={`group relative flex items-center gap-4 p-5 rounded-lg border-2 cursor-pointer transition-all shadow-sm ${isSelected ? 'border-primary bg-surface-container-low' : 'border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container-low'}`}>
                    <input
                      checked={isSelected}
                      onChange={() => setSelectedOption(optionText)}
                      className="peer sr-only"
                      name="answer"
                      type="radio"
                      value={optionText}
                    />
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-outline-variant group-hover:border-primary'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-surface-container-lowest transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    {optImg ? (
                      <div className={`flex flex-col items-start gap-2 transition-colors ${isSelected ? 'text-primary font-medium' : 'text-on-surface group-hover:text-primary'}`}>
                        <span className="font-metric-label text-sm">{key}.</span>
                        <img src={optImg} alt={`Option ${key}`} className="max-h-28 object-contain rounded-lg border border-outline-variant/50" />
                      </div>
                    ) : (
                      <span className={`font-body-lg transition-colors ${isSelected ? 'text-primary font-medium' : 'text-on-surface group-hover:text-primary'}`}>
                        <span className="font-metric-label mr-2">{key}.</span> {optionText}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <div className="mt-10 pt-6 border-t border-outline-variant flex justify-between items-center gap-3">
              <button
                onClick={handleMarkForReview}
                className={`px-3 sm:px-5 py-3 rounded-lg border font-metric-label transition-colors flex items-center gap-2 ${
                  isCurrentMarked
                    ? 'border-tertiary bg-tertiary/10 text-tertiary'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-sm">flag</span>
                <span className="hidden sm:inline">{isCurrentMarked ? 'Marked' : 'Mark for Review'}</span>
                <span className="sm:hidden">{isCurrentMarked ? 'Marked' : 'Flag'}</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                {isReviewing ? (
                  <button
                    onClick={() => { setJumpToPos(null); setSelectedOption(null); }}
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-3 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-3 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!selectedOption || isSubmitting}
                  className="px-5 sm:px-8 py-3 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSubmitting ? 'Saving…' : isReviewing ? (
                    <><span className="hidden sm:inline">Update Answer</span><span className="sm:hidden">Update</span></>
                  ) : (
                    <><span className="hidden sm:inline">Submit & Next</span><span className="sm:hidden">Submit</span></>
                  )}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Question map sidebar */}
          <aside className="w-full lg:w-80 shrink-0 hidden lg:flex flex-col gap-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] sticky top-32">
              <h3 className="font-headline-md text-on-surface text-lg mb-4">Question Map</h3>
              <div className="flex items-center gap-3 mb-6 text-caption text-on-surface-variant flex-wrap">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-secondary" /> Answered</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-primary" /> Current</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-tertiary bg-tertiary/20" /> Review</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border border-outline-variant" /> Unseen</div>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: total }).map((_, i) => {
                  const num = i + 1;
                  const isSkipped = skippedPositions.has(num);
                  const isMarked = markedPositions.has(num);
                  const isJumped = jumpToPos === num;
                  const isForwardCurrent = jumpToPos === null && num === progress + 1;
                  const isCurrent = isJumped || isForwardCurrent;
                  const isAnswered = num <= progress && !isSkipped;
                  const canJump = (isSkipped || isMarked) && !!history[num];

                  if (isCurrent) {
                    return (
                      <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center font-metric-label text-sm bg-surface-container-lowest border-2 border-primary text-primary shadow-[0px_0px_0px_4px_rgba(79,70,229,0.1)]">
                        {num}
                      </button>
                    );
                  }
                  if (canJump) {
                    return (
                      <button
                        key={i}
                        onClick={() => handleJumpToQuestion(num)}
                        title={isSkipped ? 'Skipped — click to answer' : 'Marked for review — click to revisit'}
                        className="w-10 h-10 rounded-full flex items-center justify-center font-metric-label text-sm bg-tertiary/20 text-tertiary border-2 border-tertiary hover:bg-tertiary/40 transition-colors"
                      >
                        {num}
                      </button>
                    );
                  }
                  if (isAnswered) {
                    return (
                      <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center font-metric-label text-sm bg-secondary text-on-secondary opacity-60 cursor-not-allowed">
                        {num}
                      </button>
                    );
                  }
                  return (
                    <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center font-metric-label text-sm bg-surface-container-lowest border border-outline-variant text-on-surface-variant cursor-not-allowed">
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
