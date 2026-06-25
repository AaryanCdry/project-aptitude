'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchNextSjtQuestion,
  submitSjtAnswer,
  finishSjtTest,
} from '@/app/actions/sjt';

interface Question {
  id: string;
  text: string;
  question_type: 'SJT' | null;
  options: string[];
  sjt_category?: string | null;
}

interface Props {
  testId: string;
  expiresAt: string;
}

export default function SJTClient({ testId, expiresAt: initialExpiresAt }: Props) {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(20);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [noQuestions, setNoQuestions] = useState(false);

  const [selectedBest, setSelectedBest] = useState<number | null>(null);
  const [selectedWorst, setSelectedWorst] = useState<number | null>(null);
  const [validationMsg, setValidationMsg] = useState('');

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
    setSelectedBest(null);
    setSelectedWorst(null);
    setValidationMsg('');
    try {
      const res = await fetchNextSjtQuestion(testId);
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
      setTotal(res.total ?? 20);
      questionStartRef.current = Date.now();
    } catch (err) {
      console.error('Failed to load next SJT question:', err);
      await handleFinish();
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (submitting || !question) return;
    if (selectedBest === null || selectedWorst === null) {
      setValidationMsg('Select both a Best and a Worst response to continue.');
      return;
    }
    if (selectedBest === selectedWorst) {
      setValidationMsg('Best and Worst cannot be the same option.');
      return;
    }
    setValidationMsg('');
    setSubmitting(true);
    const timeTaken = Date.now() - questionStartRef.current;
    try {
      await submitSjtAnswer(testId, question.id, selectedBest, selectedWorst, timeTaken);
    } catch (err) {
      console.error('Failed to submit SJT answer:', err);
    }
    setSubmitting(false);
    await loadNext();
  }

  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      await finishSjtTest(testId);
    } catch (err) {
      console.error('Failed to finish SJT test:', err);
    }
    router.replace(`/student/sjt-results/${testId}`);
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerWarning = timeLeft < 120;
  const canSubmit = selectedBest !== null && selectedWorst !== null && selectedBest !== selectedWorst;

  if (noQuestions) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-30 mb-4 block">cases</span>
          <h2 className="font-headline-md text-on-surface text-xl font-bold mb-2">No Questions Available</h2>
          <p className="font-body-md text-on-surface-variant mb-6">
            The SJT question bank is empty. Ask your mentor or admin to add Situational Judgement questions before retrying.
          </p>
          <a href="/student/assessments" className="inline-flex items-center gap-2 px-5 py-2.5 bg-tertiary text-on-tertiary rounded-xl font-metric-label text-sm hover:opacity-90 transition-opacity">
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
          <span className="material-symbols-outlined text-5xl text-primary animate-pulse mb-4 block">cases</span>
          <p className="text-on-surface-variant font-body-md">Scoring your competency profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-surface-container-lowest border-b border-outline-variant px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: '"FILL" 1' }}>cases</span>
          <div>
            <p className="font-metric-label text-on-surface text-sm font-semibold">Situational Judgement Test</p>
            <p className="font-caption text-on-surface-variant text-xs">
              Scenario {progress + 1} of {total}
              {question?.sjt_category && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-tertiary/10 text-tertiary text-[10px]">
                  {question.sjt_category.replace('_', ' ')}
                </span>
              )}
            </p>
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
          className="h-1 bg-tertiary transition-all duration-500"
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

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_56px_56px] gap-2 mb-2 px-1">
                <span className="font-caption text-on-surface-variant text-xs">Response</span>
                <span className="font-caption text-center text-green-700 text-xs font-semibold">Best</span>
                <span className="font-caption text-center text-red-700 text-xs font-semibold">Worst</span>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                {(question.options ?? []).map((opt: string, i: number) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr_56px_56px] gap-2 items-center px-4 py-3 rounded-xl border transition-colors ${
                      selectedBest === i ? 'border-green-400 bg-green-50/60'
                        : selectedWorst === i ? 'border-red-400 bg-red-50/60'
                        : 'border-outline-variant bg-surface-container'
                    }`}
                  >
                    <p className="text-on-surface text-sm font-body-md">
                      <span className="font-bold text-on-surface-variant mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </p>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBest(selectedBest === i ? null : i);
                          setValidationMsg('');
                        }}
                        disabled={submitting}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all disabled:opacity-50 ${
                          selectedBest === i
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-green-400 hover:bg-green-50'
                        }`}
                        aria-label={`Mark option ${String.fromCharCode(65 + i)} as Best`}
                      >
                        {selectedBest === i && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWorst(selectedWorst === i ? null : i);
                          setValidationMsg('');
                        }}
                        disabled={submitting}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all disabled:opacity-50 ${
                          selectedWorst === i
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-red-400 hover:bg-red-50'
                        }`}
                        aria-label={`Mark option ${String.fromCharCode(65 + i)} as Worst`}
                      >
                        {selectedWorst === i && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {validationMsg && (
                <p className="text-error font-caption text-sm mb-3">{validationMsg}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="w-full py-3 rounded-xl bg-tertiary text-on-tertiary font-metric-label text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {submitting ? 'Saving…' : 'Next Scenario →'}
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
