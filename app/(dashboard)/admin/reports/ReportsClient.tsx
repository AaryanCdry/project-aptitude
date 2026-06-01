'use client';

import { useState } from 'react';
import ExportButton from '../_shared/ExportButton';
import ExamAnalyticsTable from './ExamAnalyticsTable';
import type { ExamRow } from '@/app/actions/reports';

type Row = {
  id: string;
  name: string;
  email: string;
  joined: string;
  testsCompleted: number;
  avgScore: number;
  grade: string;
};

const GRADE_STYLES: Record<string, string> = {
  'Excellent':      'bg-secondary-fixed text-on-secondary-fixed-variant',
  'Above Average':  'bg-primary-fixed-dim text-on-primary-fixed',
  'Average':        'bg-surface-container-high text-on-surface',
  'Below Average':  'bg-error-container text-on-error-container',
};

type MainTab = 'summary' | 'exams';

export default function ReportsClient({ rows, examRows }: { rows: Row[]; examRows: ExamRow[] }) {
  const [mainTab, setMainTab] = useState<MainTab>('summary');
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');

  const grades = ['All', 'Excellent', 'Above Average', 'Average', 'Below Average'];

  const filtered = rows.filter(r => {
    const matchSearch = search === '' || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase());
    const matchGrade = gradeFilter === 'All' || r.grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  return (
    <div>
      {/* Main tabs */}
      <div className="flex gap-1 mb-6 bg-surface-container-low p-1 rounded-xl w-fit">
        {([
          { key: 'summary', label: 'Student Summary', icon: 'person' },
          { key: 'exams',   label: 'Exam Analytics',  icon: 'analytics' },
        ] as { key: MainTab; label: string; icon: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-metric-label text-sm transition-all ${
              mainTab === t.key ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === t.key ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
              {t.key === 'summary' ? rows.length : examRows.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Student Summary ── */}
      {mainTab === 'summary' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant flex items-center gap-3 flex-wrap bg-surface-bright">
            <div className="relative flex-1 min-w-48">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder="Search students…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {grades.map(g => <option key={g}>{g}</option>)}
            </select>
            <ExportButton />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  {['Student', 'Email', 'Joined', 'Tests', 'Avg Score', 'Grade'].map(h => (
                    <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-on-surface-variant font-body-md">
                      No students match your filters.
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-5 font-body-md text-on-surface">{r.name}</td>
                    <td className="py-3 px-5 font-body-md text-on-surface-variant">{r.email}</td>
                    <td className="py-3 px-5 font-caption text-on-surface-variant">{r.joined}</td>
                    <td className="py-3 px-5 font-body-md text-on-surface">{r.testsCompleted}</td>
                    <td className="py-3 px-5">
                      <span className={`font-bold ${r.avgScore >= 75 ? 'text-secondary' : r.avgScore >= 50 ? 'text-primary' : 'text-error'}`}>
                        {r.avgScore > 0 ? `${r.avgScore}%` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${GRADE_STYLES[r.grade] ?? 'bg-surface-container-high text-on-surface'}`}>
                        {r.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-outline-variant bg-surface-bright">
            <p className="font-caption text-on-surface-variant">Showing {filtered.length} of {rows.length} students</p>
          </div>
        </div>
      )}

      {/* ── Exam Analytics ── */}
      {mainTab === 'exams' && <ExamAnalyticsTable rows={examRows} />}
    </div>
  );
}
