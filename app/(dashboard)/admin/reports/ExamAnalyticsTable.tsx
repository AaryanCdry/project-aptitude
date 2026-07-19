'use client';

import { Fragment, useMemo, useState } from 'react';
import type { ExamRow } from '@/app/actions/reports';

type TypeFilter = 'ALL' | 'CENTER' | 'FINAL' | 'SELF';

const TYPE_CHIP: Record<string, string> = {
  CENTER: 'bg-primary/10 text-primary border border-primary/20',
  FINAL:  'bg-error-container/30 text-on-error-container border border-error/20',
  SELF:   'bg-surface-container-high text-on-surface border border-outline-variant',
};
const TYPE_LABEL: Record<string, string> = { CENTER: 'Assigned', FINAL: 'Final', SELF: 'Self' };

const TIER_RANK: Record<string, number> = { ADVANCED: 3, INTERMEDIATE: 2, BASIC: 1 };
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

function bestTier(rows: ExamRow[], field: 'certTier' | 'badgeTier'): string | null {
  return rows.reduce<string | null>((best, r) => {
    const t = r[field];
    if (!t) return best;
    if (!best || (TIER_RANK[t] ?? 0) > (TIER_RANK[best] ?? 0)) return t;
    return best;
  }, null);
}

function avgOverall(rows: ExamRow[]): number | null {
  const valid = rows.map(r => r.overallScore).filter((s): s is number => s != null);
  if (!valid.length) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function csvEscape(v: string | number | null) {
  const s = v == null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

type StudentGroup = {
  key: string;
  name: string;
  email: string;
  className: string | null;
  rows: ExamRow[];
  avg: number | null;
  bestCert: string | null;
  bestBadge: string | null;
};

export default function ExamAnalyticsTable({ rows }: { rows: ExamRow[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [classFilter, setClassFilter] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  // Filter individual rows, then group by student
  const groups = useMemo<StudentGroup[]>(() => {
    const filtered = rows.filter(r => {
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (classFilter && r.className !== classFilter) return false;
      if (nameSearch && !r.studentName.toLowerCase().includes(nameSearch.toLowerCase()) &&
          !r.studentEmail.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      return true;
    });

    const map = new Map<string, ExamRow[]>();
    for (const r of filtered) {
      const key = r.studentEmail;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }

    return [...map.entries()].map(([key, studentRows]) => ({
      key,
      name: studentRows[0].studentName,
      email: studentRows[0].studentEmail,
      className: studentRows[0].className,
      rows: studentRows,
      avg: avgOverall(studentRows),
      bestCert: bestTier(studentRows, 'certTier'),
      bestBadge: bestTier(studentRows, 'badgeTier'),
    }));
  }, [rows, typeFilter, classFilter, nameSearch]);

  function toggleExpand(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(groups.map(g => g.key)));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  function exportCsv() {
    const headers = ['Student', 'Email', 'Class', 'Assessment', 'Type', 'Date', 'Q%', 'L%', 'V%', 'S%', 'Overall%', 'Percentile', 'Certificate', 'Badge'];
    const allFiltered = groups.flatMap(g => g.rows);
    const csvRows = allFiltered.map(r => [
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

  async function exportXlsx() {
    const XLSX = await import('xlsx');
    const headers = ['Student', 'Email', 'Class', 'Assessment', 'Type', 'Date', 'Q%', 'L%', 'V%', 'S%', 'Overall%', 'Percentile', 'Certificate', 'Badge'];
    const allFiltered = groups.flatMap(g => g.rows);
    const aoa = [headers, ...allFiltered.map(r => [
      r.studentName, r.studentEmail, r.className ?? '', r.assessmentTitle ?? '',
      r.type,
      r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '',
      r.domainScores.QUANTITATIVE, r.domainScores.LOGICAL,
      r.domainScores.VERBAL, r.domainScores.SPATIAL,
      r.overallScore, r.avgPercentile,
      r.certTier ?? '', r.badgeTier ?? '',
    ])];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = headers.map(() => ({ wch: 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Exam Analytics');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
    const blob = new Blob([buf.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `exam_analytics_${new Date().toISOString().slice(0, 10)}.xlsx`,
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

  const totalRows = groups.reduce((s, g) => s + g.rows.length, 0);

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
          {groups.length > 0 && (
            <div className="flex gap-1">
              <button
                onClick={expandAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label text-sm hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">unfold_more</span>
                All
              </button>
              <button
                onClick={collapseAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-metric-label text-sm hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">unfold_less</span>
              </button>
            </div>
          )}
          <button
            onClick={exportCsv}
            disabled={groups.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            CSV
          </button>
          <button
            onClick={exportXlsx}
            disabled={groups.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Excel
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/40">
                <th className="py-3 px-4 font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider w-8" />
                {['Student', 'Class', 'Tests', 'Avg Score', 'Best Cert', 'Best Badge'].map(h => (
                  <th key={h} className="py-3 px-4 font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-outline">analytics</span>
                    No exam records match the current filters.
                  </td>
                </tr>
              ) : groups.map(g => {
                const isOpen = expanded.has(g.key);
                return (
                  <Fragment key={g.key}>
                    {/* Student summary row */}
                    <tr
                      className="border-t border-outline-variant hover:bg-surface-container/50 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(g.key)}
                    >
                      <td className="py-3 px-4">
                        <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-semibold text-[13px] text-on-surface">{g.name}</p>
                        <p className="text-[11px] text-on-surface-variant">{g.email}</p>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">
                        {g.className ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-on-surface bg-surface-container px-2.5 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[14px] text-primary">quiz</span>
                          {g.rows.length}
                        </span>
                      </td>
                      <td className="py-3 px-4 tabular-nums font-bold">
                        <ScoreCell v={g.avg} />
                      </td>
                      <td className="py-3 px-4">
                        {g.bestCert
                          ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CHIP[g.bestCert]}`}>{g.bestCert}</span>
                          : <span className="text-on-surface-variant text-[12px]">—</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        {g.bestBadge
                          ? <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CHIP[g.bestBadge]}`}>
                              <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: '"FILL" 1' }}>military_tech</span>
                              {g.bestBadge}
                            </span>
                          : <span className="text-on-surface-variant text-[12px]">—</span>
                        }
                      </td>
                    </tr>

                    {/* Expanded detail rows */}
                    {isOpen && (
                      <Fragment key={`${g.key}-detail`}>
                        {/* Sub-header */}
                        <tr className="bg-surface-container-low/60">
                          <td />
                          {['Assessment', 'Type', 'Completed', 'Q%', 'L%', 'V%', 'S%', 'Overall', 'Pctile', 'Cert', 'Badge'].map(h => (
                            <td key={h} className="py-1.5 px-4 font-metric-label text-on-surface-variant text-[10px] uppercase tracking-wider whitespace-nowrap">
                              {h}
                            </td>
                          ))}
                        </tr>
                        {g.rows.map((r, i) => (
                          <tr key={r.id} className={`bg-surface-container/20 border-t border-outline-variant/50 hover:bg-surface-container/40 transition-colors ${i === g.rows.length - 1 ? 'border-b border-outline-variant' : ''}`}>
                            <td className="py-2.5 px-4">
                              <div className="w-px h-5 bg-outline-variant mx-auto" />
                            </td>
                            <td className="py-2.5 px-4 text-on-surface text-[12px] max-w-40">
                              <span className="block truncate">
                                {r.assessmentTitle ?? <span className="text-on-surface-variant italic">Self Practice</span>}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_CHIP[r.type]}`}>
                                {TYPE_LABEL[r.type]}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-on-surface-variant text-[12px] whitespace-nowrap">
                              {r.completedAt ? new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="py-2.5 px-4 tabular-nums"><ScoreCell v={r.domainScores.QUANTITATIVE} /></td>
                            <td className="py-2.5 px-4 tabular-nums"><ScoreCell v={r.domainScores.LOGICAL} /></td>
                            <td className="py-2.5 px-4 tabular-nums"><ScoreCell v={r.domainScores.VERBAL} /></td>
                            <td className="py-2.5 px-4 tabular-nums"><ScoreCell v={r.domainScores.SPATIAL} /></td>
                            <td className="py-2.5 px-4 tabular-nums font-bold"><ScoreCell v={r.overallScore} /></td>
                            <td className="py-2.5 px-4 text-on-surface-variant tabular-nums text-[12px]">
                              {r.avgPercentile != null ? `${r.avgPercentile}th` : '—'}
                            </td>
                            <td className="py-2.5 px-4">
                              {r.certTier
                                ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CHIP[r.certTier]}`}>{r.certTier}</span>
                                : <span className="text-on-surface-variant text-[12px]">—</span>
                              }
                            </td>
                            <td className="py-2.5 px-4">
                              {r.badgeTier
                                ? <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CHIP[r.badgeTier]}`}>
                                    <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: '"FILL" 1' }}>military_tech</span>
                                    {r.badgeTier}
                                  </span>
                                : <span className="text-on-surface-variant text-[12px]">—</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-outline-variant bg-surface-bright flex items-center gap-4">
          <p className="font-caption text-on-surface-variant">
            {groups.length} {groups.length === 1 ? 'student' : 'students'} · {totalRows} exam records
          </p>
          {expanded.size > 0 && (
            <p className="font-caption text-primary text-[11px]">
              {expanded.size} expanded
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
