'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type TestRow = {
  id: string;
  type: 'SELF' | 'CENTER' | 'FINAL';
  date: string;
  completedAt: string | null;
  scores: Array<{ domain: string; score: number }>;
  overallScore: number | null;
  avgScore: number;
  assessmentTitle: string | null;
};

type Tab = 'ALL' | 'SELF' | 'CENTER' | 'FINAL';

const TAB_CONFIG: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'ALL',    label: 'All',            icon: 'list' },
  { key: 'SELF',   label: 'Self Practice',  icon: 'quiz' },
  { key: 'CENTER', label: 'Assigned Tests', icon: 'assignment' },
  { key: 'FINAL',  label: 'Final Exams',    icon: 'military_tech' },
];

const TYPE_CHIP: Record<Tab, string> = {
  ALL:    '',
  SELF:   'bg-surface-container-high text-on-surface border border-outline-variant',
  CENTER: 'bg-primary/10 text-primary border border-primary/20',
  FINAL:  'bg-error-container/30 text-on-error-container border border-error/20',
};

const TYPE_LABEL: Record<string, string> = {
  SELF:   'Self Practice',
  CENTER: 'Assigned',
  FINAL:  'Final Exam',
};

export default function TestHistoryTabs({ tests }: { tests: TestRow[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('ALL');

  const counts = useMemo(() => ({
    ALL:    tests.length,
    SELF:   tests.filter(t => t.type === 'SELF').length,
    CENTER: tests.filter(t => t.type === 'CENTER').length,
    FINAL:  tests.filter(t => t.type === 'FINAL').length,
  }), [tests]);

  const filtered = useMemo(() =>
    activeTab === 'ALL' ? tests : tests.filter(t => t.type === activeTab),
    [tests, activeTab]
  );

  return (
    <div>
      {/* Tab chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key];
          if (tab.key !== 'ALL' && count === 0) return null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-metric-label transition-colors ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright">
                <th className="py-3 px-5 font-metric-label text-[11px] uppercase tracking-wider text-on-surface-variant">Date</th>
                {activeTab === 'ALL' && (
                  <th className="py-3 px-5 font-metric-label text-[11px] uppercase tracking-wider text-on-surface-variant">Type</th>
                )}
                {(activeTab === 'CENTER' || activeTab === 'FINAL') && (
                  <th className="py-3 px-5 font-metric-label text-[11px] uppercase tracking-wider text-on-surface-variant">Assessment</th>
                )}
                {activeTab !== 'FINAL' && (
                  <th className="py-3 px-5 font-metric-label text-[11px] uppercase tracking-wider text-on-surface-variant">Domains</th>
                )}
                <th className="py-3 px-5 font-metric-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  {activeTab === 'FINAL' ? 'Score' : 'Avg Score'}
                </th>
                <th className="py-3 px-5 font-metric-label text-[11px] uppercase tracking-wider text-on-surface-variant"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-outline">history</span>
                    No {activeTab === 'ALL' ? '' : TYPE_LABEL[activeTab].toLowerCase() + ' '}tests yet.
                  </td>
                </tr>
              ) : filtered.map(t => {
                const displayScore = t.type === 'FINAL' ? (t.overallScore ?? t.avgScore) : t.avgScore;
                const scoreColor = displayScore >= 75 ? 'text-secondary' : displayScore >= 50 ? 'text-primary' : 'text-error';
                return (
                  <tr key={t.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-5 font-body-md text-on-surface whitespace-nowrap">{t.date}</td>

                    {activeTab === 'ALL' && (
                      <td className="py-3 px-5">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${TYPE_CHIP[t.type as Tab]}`}>
                          {TYPE_LABEL[t.type]}
                        </span>
                      </td>
                    )}

                    {(activeTab === 'CENTER' || activeTab === 'FINAL') && (
                      <td className="py-3 px-5 font-body-md text-on-surface max-w-50">
                        <span className="truncate block">{t.assessmentTitle ?? '—'}</span>
                      </td>
                    )}

                    {activeTab !== 'FINAL' && (
                      <td className="py-3 px-5">
                        <div className="flex gap-1 flex-wrap">
                          {t.scores.map((s) => (
                            <span key={s.domain} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                              {s.domain} {s.score}%
                            </span>
                          ))}
                          {t.scores.length === 0 && <span className="text-on-surface-variant text-xs">—</span>}
                        </div>
                      </td>
                    )}

                    <td className="py-3 px-5">
                      <span className={`font-body-md font-bold ${scoreColor}`}>{displayScore}%</span>
                    </td>

                    <td className="py-3 px-5">
                      <Link
                        href={`/student/results/${t.id}`}
                        className="font-caption text-primary hover:underline flex items-center gap-1 whitespace-nowrap"
                      >
                        View <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
