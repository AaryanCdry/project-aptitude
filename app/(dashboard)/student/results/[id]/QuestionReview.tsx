'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { questionPoints } from '@/lib/adaptive';

export default function QuestionReview({ attempt, index }: { attempt: any, index: number }) {
  const [showExplanation, setShowExplanation] = useState(false);
  const q = Array.isArray(attempt.questions) ? attempt.questions[0] : attempt.questions;
  const isCorrect = attempt.is_correct;
  const points = questionPoints(q?.difficulty ?? 1, isCorrect, attempt.time_taken_ms ?? 0);
  
  const formatTime = (ms: number) => {
    if (!ms) return 'N/A';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className={`bg-surface rounded-xl border ${isCorrect ? 'border-outline-variant' : 'border-error'} p-6 flex flex-col gap-4 shadow-sm hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow`}>
      <div className="flex items-start gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isCorrect ? 'bg-secondary-fixed text-secondary' : 'bg-error-container text-error'}`}>
          <span className="material-symbols-outlined text-[20px]">{isCorrect ? 'check' : 'close'}</span>
        </div>
        
        <div className="flex flex-col flex-grow gap-2">
          <div className="flex justify-between items-center">
            <span className="font-metric-label text-on-surface-variant">
              Q{index + 1} &bull; {q?.domain || 'General'} &bull; L{q?.difficulty || 1}
            </span>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 font-metric-label text-xs px-2 py-0.5 rounded-full ${isCorrect ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-surface-container-high text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[14px]">monetization_on</span>
                {points} pts
              </span>
              <span className="font-caption text-on-surface-variant">{formatTime(attempt.time_taken_ms)}</span>
            </div>
          </div>
          <p className="font-body-lg text-on-surface">{q?.text}</p>
          
          {!isCorrect && (
            <div className="flex gap-6 mt-2">
              <div className="flex flex-col">
                <span className="font-caption text-on-surface-variant">Your Answer</span>
                <span className="font-body-md text-error line-through">{attempt.selected_answer || 'Skipped'}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-caption text-on-surface-variant">Correct Answer</span>
                <span className="font-body-md text-secondary">{q?.correct_answer}</span>
              </div>
            </div>
          )}

          {q?.explanation && (
            <div className="mt-2">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-primary font-metric-label text-sm hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showExplanation ? 'visibility_off' : 'visibility'}
                </span>
                {showExplanation ? 'Hide AI Explanation' : 'View AI Explanation'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Details */}
      {showExplanation && (
        <div className="mt-2 bg-surface-container-low rounded-lg p-6 border border-outline-variant relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">psychology</span>
            <h4 className="font-metric-label text-primary uppercase">AI Explanation</h4>
          </div>
          <div className="font-body-md text-on-surface leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-strong:text-primary prose-ul:my-2 prose-li:my-0">
            <ReactMarkdown>{q?.explanation?.replace(/\\n/g, '\n').replace(/\n/g, '  \n')}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
