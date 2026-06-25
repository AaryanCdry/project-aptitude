'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchNextPersonalityQuestion,
  submitPersonalityAnswer,
  finishPersonalityTest,
} from '@/app/actions/personality';

interface Question {
  id: string;
  text: string;
  question_type: 'LIKERT' | 'FORCED_CHOICE' | 'PERSONALITY_MCQ' | 'MCQ' | null;
  options: string[];
  forced_choice_opts?: Array<{ text: string; trait: string }> | null;
}

interface Props {
  testId: string;
  expiresAt: string;
}

export default function PersonalityClient({ testId, expiresAt: initialExpiresAt }: Props) {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(30);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [noQuestions, setNoQuestions] = useState(false);

  const questionStartRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadNext(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const expires = new Date(initialExpiresAt).getTime();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const secs = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setTimeLeft(secs);
      if (secs === 0) {
        clearInterval(intervalRef.current!);
        handleFinish();
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExpiresAt]);

  async function loadNext(isFirst = false) {
    setLoading(true);
    setQuestion(null);
    try {
      const res = await fetchNextPersonalityQuestion(testId);
      if (!res || res.finished) {
        if (isFirst) {
          setNoQuestions(true);
          setLoading(false);
          return;
        }
        await handleFinish();
        return;
      }
      setQuestion(res.question);
      setProgress(res.progress ?? 0);
      setTotal(res.total ?? 30);
      questionStartRef.current = Date.now();
    } catch (err) {
      console.error('Failed to load next personality question:', err);
      await handleFinish();
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(answer: string) {
    if (submitting || !question) return;
    setSubmitting(true);
    const timeTaken = Date.now() - questionStartRef.current;
    try {
      await submitPersonalityAnswer(testId, question.id, answer, timeTaken);
    } catch (err) {
      console.error('Failed to submit personality answer:', err);
    }
    setSubmitting(false);
    await loadNext();
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      await finishPersonalityTest(testId);
    } catch (err) {
      console.error('Failed to finish personality test:', err);
    }
    router.replace(`/student/personality-results/${testId}`);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerWarning = timeLeft < 120;

  if (noQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-30 mb-4 block">psychology</span>
          <h2 className="font-headline-md text-on-surface text-xl font-bold mb-2">No Questions Available</h2>
          <p className="font-body-md text-on-surface-variant mb-6">
            The Personality Assessment question bank is empty. Ask your mentor or admin to add questions before retrying.
          </p>
          <a href="/student/assessments" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-metric-label text-sm hover:opacity-90 transition-opacity">
            Back to Assessments
          </a>
        </div>
      </div>
    );
  }

  if (finishing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-pulse mb-4 block">psychology</span>
          <p className="text-on-surface-variant font-body-md">Analysing your personality profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: '"FILL" 1' }}>psychology</span>
          <div>
            <p className="font-metric-label text-on-surface text-sm font-semibold">Personality Assessment</p>
            <p className="font-caption text-on-surface-variant text-xs">{progress + 1} of {total}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-metric-label text-sm font-bold ${timerWarning ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface'}`}>
          <span className="material-symbols-outlined text-sm">timer</span>
          {mins}:{secs.toString().padStart(2, '0')}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-surface-container">
        <div
          className="h-1 bg-primary transition-all duration-500"
          style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
        />
      </div>

      {/* Question area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {loading ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl animate-spin mb-2 block">refresh</span>
            </div>
          ) : question ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
              <p className="font-body-lg text-on-surface text-base leading-relaxed mb-6">{question.text}</p>

              {/* LIKERT */}
              {question.question_type === 'LIKERT' && (
                <div>
                  <div className="flex justify-between text-xs text-on-surface-variant mb-3 px-1">
                    <span>Strongly Disagree</span>
                    <span>Strongly Agree</span>
                  </div>
                  <div className="flex gap-3 justify-center">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => handleAnswer(String(v))}
                        disabled={submitting}
                        className="flex flex-col items-center gap-2 group disabled:opacity-50"
                      >
                        <span className="w-12 h-12 rounded-full border-2 border-outline-variant bg-surface-container flex items-center justify-center font-bold text-lg text-on-surface group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary transition-all">
                          {v}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FORCED_CHOICE */}
              {question.question_type === 'FORCED_CHOICE' && (
                <div className="grid grid-cols-2 gap-4">
                  {(question.forced_choice_opts ?? question.options ?? []).map((opt: any, i: number) => {
                    const text = typeof opt === 'string' ? opt : opt.text;
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(text)}
                        disabled={submitting}
                        className="p-5 rounded-xl border-2 border-outline-variant bg-surface-container text-on-surface text-sm font-body-md leading-relaxed hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50"
                      >
                        {text}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PERSONALITY_MCQ or MCQ fallback */}
              {(question.question_type === 'PERSONALITY_MCQ' || question.question_type === 'MCQ' || !question.question_type) && (
                <div className="flex flex-col gap-3">
                  {(question.options ?? []).map((opt: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt)}
                      disabled={submitting}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface text-sm font-body-md text-left hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                      <span className="w-7 h-7 rounded-full border-2 border-outline-variant bg-surface flex items-center justify-center font-bold text-xs text-on-surface-variant shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
