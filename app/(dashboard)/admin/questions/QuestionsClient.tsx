'use client';

import React, { useState } from 'react';
import { generateExplanation } from '@/app/actions/admin';

export default function QuestionsClient({ initialQuestions }: { initialQuestions: any[] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleGenerate = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await generateExplanation(id);
      if (res.success) {
        setQuestions(questions.map(q => q.id === id ? { ...q, explanation: res.explanation } : q));
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline-lg text-3xl text-on-surface mb-2">Question Bank</h1>
          <p className="font-body-md text-on-surface-variant">Manage your questions and generate AI explanations.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="p-4 font-metric-label text-on-surface-variant uppercase text-sm">Domain</th>
              <th className="p-4 font-metric-label text-on-surface-variant uppercase text-sm">Difficulty</th>
              <th className="p-4 font-metric-label text-on-surface-variant uppercase text-sm w-1/3">Question Text</th>
              <th className="p-4 font-metric-label text-on-surface-variant uppercase text-sm w-1/3">Explanation</th>
              <th className="p-4 font-metric-label text-on-surface-variant uppercase text-sm text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {questions.map((question) => (
              <tr key={question.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="p-4 font-body-md text-on-surface">
                  <span className="bg-surface-container border border-outline-variant px-2 py-1 rounded text-xs">
                    {question.domain}
                  </span>
                </td>
                <td className="p-4 font-body-md text-on-surface">
                  Level {question.difficulty}
                </td>
                <td className="p-4 font-body-md text-on-surface">
                  <div className="line-clamp-2" title={question.text}>{question.text}</div>
                </td>
                <td className="p-4 font-body-md text-on-surface-variant text-sm">
                  {question.explanation ? (
                    <div className="line-clamp-2 text-primary" title={question.explanation}>
                      {question.explanation}
                    </div>
                  ) : (
                    <span className="italic text-on-surface-variant/70">No explanation</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleGenerate(question.id)}
                    disabled={loadingId === question.id}
                    className="bg-primary text-on-primary font-metric-label text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 ml-auto"
                  >
                    {loadingId === question.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        {question.explanation ? 'Regenerate' : 'Generate'}
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {questions.length === 0 && (
          <div className="p-8 text-center text-on-surface-variant font-body-md">
            No questions found in the database.
          </div>
        )}
      </div>
    </div>
  );
}
