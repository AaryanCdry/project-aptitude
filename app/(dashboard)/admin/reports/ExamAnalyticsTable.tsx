'use client';

import { useMemo, useState } from 'react';
import type { ExamRow } from '@/app/actions/reports';

type TypeFilter = 'ALL' | 'CENTER' | 'FINAL' | 'SELF';

const TYPE_CHIP: Record<string, string> = {
  CENTER: 'bg-primary/10 text-primary border border-primary/20',
  FINAL:  'bg-error-container/30 text-on-error-container border border-error/20',
  SELF:   'bg-surface-container-high text-on-surface border border-outline-variant',
};
const TYPE_LABEL: Record<string, string> = { CENTER: 'Assigned', FINAL: 'Final', SELF: 'Self' };

const TIER_CHIP: Record<string, string> = {
  ADVANCED:     'bg-error-container text-on-error-container',
  INTERMEDIATE: 'bg-primary-fixed-dim text-on-primary-fixed',
  BASIC:        'bg-secondary-fixed text-on-secondary-fixed-variant',
};

function scoreColor(v: number | null) {
  if (v == null) return 'text-on-surface-variant';
  if (v >= 75) return 'text-secondary font-semibold';
  if (v >= 50) return 'text-primary';
  return 'text-error';
}

function ScoreCell({ v }: { v: number | null }) {
  return <span className={scoreColor(v)}>{v != null ? `${v}%` : '—'}</span>;
}

function csvEscape(v: string | number | null) {
  const s = v == null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ExamAnalyticsTable({ rows }: { rows: ExamRow[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [classFilter, setClassFilter] = useState('');
  const [nameSearch, setNameSearch] = useState('');

  const typeCounts = useMemo(() => ({
    ALL:    rows.length,
    CENTER: rows.filter(r => r.type === 'CENTER').length,
    FINAL:  rows.filter(r => r.type === 'FINAL').length,
    SELF:   rows.filter(r => r.type === 'SELF').length,
  }), [rows]);

  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) { if (r.className && !seen.has(r.className)) seen.add(r.className); }
    return [...seen].sort();
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (classFilter && r.className !== classFilter) return false;
    if (nameSearch && !r.studentName.toLowerCase().includes(nameSearch.toLowerCase()) &&
        !r.studentEmail.toLowerCase().includes(nameSearch.toLowerCase())) return false;
    return true;
  }), [rows, typeFilter, classFilter, nameSearch]);

  function exportCsv() {
    const headers = ['Student', 'Email', 'Class', 'Assessment', 'Type', 'Date', 'Q%', 'L%', 'V%', 'S%', 'Overall%', 'Percentile', 'Certificate', 'Badge'];
    const csvRows = filtered.map(r => [
      r.studentName, r.studentEmail, r.className ?? '', r.assessmentTitle ?? '',
      r.type,
      r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '',
      r.domainScores.QUANTITATIVE, r.domainScores.LOGICAL,
      r.domainScores.VERBAL, r.domainScores.SPATIAL,
      r.overallScore, r.avgPercentile,
      r.certTier ?? '', r.badgeTier ?? '',
    ].map(csvEscape).join(','));
    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `exam_analytics_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const tabDefs: { key: TypeFilter; label: string; icon: string }[] = [
    { key: 'ALL',    label: 'All Tests',      icon: 'list' },
    { key: 'CENTER', label: 'Assigned Tests',  icon: 'assignment' },
    { key: 'FINAL',  label: 'Final Exams',     icon: 'military_tech' },
    { key: 'SELF',   label: 'Self Practice',   icon: 'quiz' },
  ];

  return (
    <div>
      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabDefs.map(tab => {
          const count = typeCounts[tab.key];
          if (tab.key !== 'ALL' && count === 0) return null;
          const active = typeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-metric-label transition-colors ${
                active ? 'bg-primary text-on-primary shadow-sm' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              {tab.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${active ? 'bg-white/20' : 'bg-surface-container-high text-on-surface'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-outline-variant flex flex-wrap items-center gap-3 bg-surface-bright">
          <div className="relative flex-1 min-w-44">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              type="text"
              placeholder="Search student name or email…"
              value={nameSearch}
              onChange={e => setNameSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All classes</option>
            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/40">
                {['Student', 'Class', 'Assessment', 'Type', 'Completed', 'Q%', 'L%', 'V%', 'S%', 'Overall', 'Pctile', 'Cert', 'Badge'].map(h => (
                  <th key={h} className="py-3 px-4 font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-outline">analytics</span>
                    No exam records match the current filters.
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 px-4 font-body-md text-on-surface whitespace-nowrap">
                    <p className="font-semibold text-[13px]">{r.studentName}</p>
                    <p className="text-[11px] text-on-surface-variant">{r.studentEmail}</p>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">{r.className ?? '—'}</td>
                  <td className="py-3 px-4 text-on-surface text-[12px] max-w-40">
                    <span className="block truncate">{r.assessmentTitle ?? <span className="text-on-surface-variant italic">Self Practice</span>}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_CHIP[r.type]}`}>
                      {TYPE_LABEL[r.type]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">
                    {r.completedAt ? new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="py-3 px-4 tabular-nums"><ScoreCell v={r.domainScores.QUANTITATIVE} /></td>
                  <td className="py-3 px-4 tabular-nums"><ScoreCell v={r.domainScores.LOGICAL} /></td>
                  <td className="py-3 px-4 tabular-nums"><ScoreCell v={r.domainScores.VERBAL} /></td>
                  <td className="py-3 px-4 tabular-nums"><ScoreCell v={r.domainScores.SPATIAL} /></td>
                  <td className="py-3 px-4 tabular-nums font-bold"><ScoreCell v={r.overallScore} /></td>
                  <td className="py-3 px-4 text-on-surface-variant tabular-nums text-[12px]">
                    {r.avgPercentile != null ? `${r.avgPercentile}th` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {r.certTier
                      ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CHIP[r.certTier]}`}>{r.certTier}</span>
                      : <span className="text-on-surface-variant text-[12px]">—</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    {r.badgeTier
                      ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CHIP[r.badgeTier]}`}>
                          <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: '"FILL" 1' }}>military_tech</span>
                          {r.badgeTier}
                        </span>
                      )
                      : <span className="text-on-surface-variant text-[12px]">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-outline-variant bg-surface-bright">
          <p className="font-caption text-on-surface-variant">Showing {filtered.length} of {rows.length} exam records</p>
        </div>
      </div>
    </div>
  );
}
