'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchNextQuestion, submitAnswer, finishTest } from '../actions/assessment';
import { createProctorSession, applyEvent, buildLogPayload, submitProctoringLog } from '@/lib/proctor';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';


interface AssessmentClientProps {
  testId: string;
}

export default function AssessmentClient({ testId }: AssessmentClientProps) {
  const router = useRouter();
  const [question, setQuestion] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(25);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testFinished, setTestFinished] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref so the interval callback always sees the latest question without stale closure
  const questionRef = useRef<any>(null);
  const timerSecondsRef = useRef<number | null>(null);
  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { timerSecondsRef.current = timerSeconds; }, [timerSeconds]);

  // Proctoring
  const proctorRef = useRef(createProctorSession(testId));
  const questionTimingsRef = useRef<number[]>([]);

  useEffect(() => {
    loadNextQuestion();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Track tab switches and focus loss for proctoring
  useEffect(() => {
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') {
        proctorRef.current = applyEvent(proctorRef.current, { type: 'VISIBILITY_HIDDEN' });
      }
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

  // Restart countdown whenever the question changes
  useEffect(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timerSeconds == null) { setTimeLeft(null); return; }
    setTimeLeft(timerSeconds);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev == null || prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          const q = questionRef.current;
          const ts = timerSecondsRef.current ?? 30;
          if (q) {
            questionTimingsRef.current.push(ts * 1000);
            submitAnswer(testId, q.id, '__TIMEOUT__', ts * 1000)
              .then(() => loadNextQuestion())
              .catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, timerSeconds]);

  const loadNextQuestion = async () => {
    setLoading(true);
    try {
      const res = await fetchNextQuestion(testId);
      if (res.finished) {
        await handleFinishTest();
      } else {
        setQuestion(res.question);
        setProgress(res.progress || 0);
        setTotal(res.total || 25);
        setTimerSeconds((res as any).timerSeconds ?? null);
        setSelectedOption(null);
      }
    } catch (error) {
      console.error("Failed to load question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTest = async () => {
    setTestFinished(true);
    const res = await finishTest(testId);
    setScore(res.score);
    setAttempts(res.attempts || []);

    // Submit proctoring log (fire-and-forget)
    const timings = questionTimingsRef.current;
    const avgTimeMs = timings.length > 0
      ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length)
      : 0;
    submitProctoringLog(buildLogPayload(proctorRef.current, avgTimeMs)).catch(console.error);
  };

  const handleSubmit = async () => {
    if (!selectedOption || !question) return;
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setIsSubmitting(true);
    try {
      const elapsed = timerSeconds != null ? (timerSeconds - (timeLeft ?? 0)) * 1000 : 10000;
      questionTimingsRef.current.push(elapsed);
      await submitAnswer(testId, question.id, selectedOption, elapsed);
      await loadNextQuestion();
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (testFinished) {
    return (
      <div className="min-h-screen bg-surface-container-lowest p-6 md:p-10 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Summary Header */}
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

  if (!question) return null;

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
            <span className="material-symbols-outlined" data-icon="close">close</span>
          </button>
          <div>
            <h2 className="font-metric-label text-primary uppercase tracking-wider text-xs">Exam Mode</h2>
            <h1 className="font-headline-md text-on-surface text-lg md:text-xl truncate max-w-[250px] md:max-w-md">{question.domain || 'Adaptive Test'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="flex flex-col gap-1 hidden md:flex w-48">
            <div className="flex justify-between items-center text-sm">
              <span className="font-metric-label text-on-surface">Question {currentQuestionNumber} of {total}</span>
              <span className="font-metric-label text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div>
            </div>
          </div>

          {timeLeft != null ? (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-metric-label transition-colors ${timeLeft <= 10 ? 'bg-error-container border-error text-on-error-container' : 'bg-surface-container-low border-outline-variant text-on-surface'}`}>
              <span className="material-symbols-outlined text-sm" data-icon="timer">timer</span>
              <span className="text-lg tabular-nums">
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant">
              <span className="material-symbols-outlined text-outline" data-icon="timer">timer</span>
              <span className="font-metric-label text-on-surface-variant text-sm">No limit</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow flex justify-center py-margin-desktop px-margin-mobile pb-24 md:pb-margin-desktop">
        <div className="w-full max-w-container-max-width flex flex-col lg:flex-row gap-gutter items-start">
          
          <div key={question.id} className="animate-slide-up flex-grow w-full max-w-assessment-max-width bg-surface-container-lowest border border-outline-variant rounded-xl p-6 md:p-10 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-surface-container rounded-full text-primary font-metric-label text-xs mb-4">Question {currentQuestionNumber} (Lvl {question.difficulty})</span>
              <p className="font-question-text text-on-surface text-lg leading-relaxed">
                  {question.text}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {Array.isArray(question.options) && question.options.map((optionText: string, index: number) => {
                const isSelected = selectedOption === optionText;
                const key = String.fromCharCode(65 + index); // A, B, C, D

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
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-primary bg-primary' : 'border-outline-variant group-hover:border-primary'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-surface-container-lowest transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}></div>
                    </div>
                    <span className={`font-body-lg transition-colors ${isSelected ? 'text-primary font-medium' : 'text-on-surface group-hover:text-primary'}`}>
                      <span className="font-metric-label mr-2">{key}.</span> {optionText}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-10 pt-6 border-t border-outline-variant flex justify-between items-center">
              <button className="px-6 py-3 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label hover:bg-surface-container-high transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" data-icon="flag">flag</span>
                  Mark for Review
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!selectedOption || isSubmitting}
                className="px-8 py-3 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isSubmitting ? 'Saving...' : 'Submit & Next'}
                  <span className="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
              </button>
            </div>
          </div>

          <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6 hidden lg:flex">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05)] sticky top-32">
              <h3 className="font-headline-md text-on-surface text-lg mb-4">Question Map</h3>
              <div className="flex items-center gap-4 mb-6 text-caption text-on-surface-variant">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-secondary"></div> Answered</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-primary"></div> Current</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border border-outline-variant"></div> Unseen</div>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: total }).map((_, i) => {
                  const num = i + 1;
                  if (num < currentQuestionNumber) {
                    return <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center font-metric-label text-sm bg-secondary text-on-secondary opacity-50 cursor-not-allowed">{num}</button>;
                  }
                  if (num === currentQuestionNumber) {
                    return <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center font-metric-label text-sm bg-surface-container-lowest border-2 border-primary text-primary shadow-[0px_0px_0px_4px_rgba(79,70,229,0.1)]">{num}</button>;
                  }
                  return <button key={i} className="w-10 h-10 rounded-full flex items-center justify-center font-metric-label text-sm bg-surface-container-lowest border border-outline-variant text-on-surface-variant cursor-not-allowed">{num}</button>;
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
