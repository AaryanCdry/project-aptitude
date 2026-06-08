'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { getAssessmentDetail } from '@/app/actions/admin';
import { getInitials } from '@/lib/utils';

type AssessmentStat = {
  id: string;
  title: string;
  classLabel: string | null;
  domain: string | null;
  scheduledAt: string | null;
  dueDate: string | null;
  total: number;
  completed: number;
  inProgress: number;
};

type StudentRow = {
  testId: string;
  studentId: string;
  name: string;
  email: string;
  className: string | null;
  status: string;
  completedAt: string | null;
  score: number | null;
  correct: number | null;
  totalQ: number | null;
};

type Detail = {
  id: string;
  title: string;
  classLabel: string | null;
  domain: string | null;
  scheduledAt: string | null;
  dueDate: string | null;
  instructions: string | null;
  students: StudentRow[];
};

type Category = 'upcoming' | 'ongoing' | 'completed';

function categorize(a: AssessmentStat, now: Date): Category {
  const due = a.dueDate ? new Date(a.dueDate) : null;
  const start = a.scheduledAt ? new Date(a.scheduledAt) : null;
  if (due && due <= now) return 'completed';
  if (start && start > now) return 'upcoming';
  return 'ongoing';
}

function formatDate(iso: string | null, prefix: string): string {
  if (!iso) return 'No date set';
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const daysDiff = Math.round(diff / (1000 * 60 * 60 * 24));
  let rel: string;
  if (daysDiff === 0) rel = `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  else if (daysDiff === 1) rel = 'Tomorrow';
  else if (daysDiff === -1) rel = 'Yesterday';
  else rel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${prefix} ${rel}`;
}

function formatAbs(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const cmpStr = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });

function sortBucket(rows: AssessmentStat[], cat: Category): AssessmentStat[] {
  return [...rows].sort((a, b) => {
    if (cat === 'upcoming') {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return ta - tb;
    }
    if (cat === 'ongoing') {
      if (!a.dueDate && !b.dueDate) return cmpStr(a.title, b.title);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    const ta = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const tb = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return tb - ta;
  });
}

function StatusPill({ status }: { status: string }) {
  if (status === 'COMPLETED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />Completed
    </span>
  );
  if (status === 'IN_PROGRESS') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Active
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase">
      <span className="w-1.5 h-1.5 rounded-full bg-outline" />Scheduled
    </span>
  );
}

function AssessmentCard({ a, cat, onClick }: { a: AssessmentStat; cat: Category; onClick: () => void }) {
  const scheduled = a.total - a.completed - a.inProgress;
  const pct = a.total > 0 ? Math.round((a.completed / a.total) * 100) : 0;

  const dateLabel = cat === 'upcoming'
    ? formatDate(a.scheduledAt, 'Starts')
    : cat === 'ongoing'
    ? (a.dueDate ? formatDate(a.dueDate, 'Due') : 'No due date')
    : formatDate(a.dueDate, 'Ended');

  const cardCls = cat === 'ongoing'
    ? 'border-primary-fixed bg-surface-container-low hover:bg-surface-container-high hover:ring-1 ring-primary/20'
    : cat === 'completed'
    ? 'border-secondary-fixed-dim bg-secondary-fixed/10 hover:bg-secondary-fixed/20 opacity-80 hover:opacity-100'
    : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:ring-1 ring-primary/20';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border transition-all cursor-pointer ${cardCls}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <h3 className="font-body-md font-semibold text-on-surface truncate pr-2">{a.title}</h3>
        <span className="font-caption text-on-surface-variant text-xs shrink-0">{dateLabel}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {a.classLabel && (
          <span className="font-caption text-on-surface-variant flex items-center gap-1 text-xs min-w-0 max-w-full">
            <span className="material-symbols-outlined text-sm shrink-0">meeting_room</span>
            <span className="truncate">{a.classLabel}</span>
          </span>
        )}
        {a.domain && (
          <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-metric-label text-on-surface-variant">{a.domain}</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mb-2 flex-wrap">
        {scheduled > 0 && <span>{scheduled} waiting</span>}
        {a.inProgress > 0 && <span className="text-primary font-medium">{a.inProgress} active</span>}
        {a.completed > 0 && <span>{a.completed} done</span>}
        {a.total > 0 && <><span className="text-outline">·</span><span>{a.total} total</span></>}
      </div>
      {a.total > 0 && (
        <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${cat === 'completed' ? 'bg-secondary' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </button>
  );
}

type SectionConfig = {
  cat: Category;
  label: string;
  icon: string;
  iconCls: string;
  pillCls: string;
};

const SECTIONS: SectionConfig[] = [
  { cat: 'upcoming',  label: 'Upcoming',  icon: 'schedule',     iconCls: 'text-tertiary',  pillCls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  { cat: 'ongoing',   label: 'Ongoing',   icon: 'play_circle',  iconCls: 'text-primary',   pillCls: 'bg-primary-fixed text-on-primary-fixed' },
  { cat: 'completed', label: 'Completed', icon: 'check_circle', iconCls: 'text-secondary', pillCls: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
];

export default function UpcomingTestsPanel({ assessments }: { assessments: AssessmentStat[] }) {
  const now = useMemo(() => new Date(), []);

  const [query, setQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [openSections, setOpenSections] = useState<Record<Category, boolean>>({
    upcoming: true, ongoing: true, completed: false,
  });

  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cohortOptions = useMemo(() => {
    const s = new Set<string>();
    assessments.forEach(a => { if (a.classLabel) s.add(a.classLabel); });
    return [...s].sort();
  }, [assessments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = assessments;
    if (q) rows = rows.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.classLabel ?? '').toLowerCase().includes(q) ||
      (a.domain ?? '').toLowerCase().includes(q)
    );
    if (cohortFilter !== 'ALL') rows = rows.filter(a => a.classLabel === cohortFilter);
    return rows;
  }, [assessments, query, cohortFilter]);

  const buckets = useMemo(() => {
    const b: Record<Category, AssessmentStat[]> = { upcoming: [], ongoing: [], completed: [] };
    for (const a of filtered) b[categorize(a, now)].push(a);
    return {
      upcoming:  sortBucket(b.upcoming, 'upcoming'),
      ongoing:   sortBucket(b.ongoing, 'ongoing'),
      completed: sortBucket(b.completed, 'completed'),
    };
  }, [filtered, now]);

  const filtersActive = query !== '' || cohortFilter !== 'ALL';

  const openDetail = (id: string) => {
    setDetail(null);
    setDetailError(null);
    // open drawer immediately with loading state
    setDetail({ id, title: '', classLabel: null, domain: null, scheduledAt: null, dueDate: null, instructions: null, students: [] });
    startTransition(async () => {
      try {
        const d = await getAssessmentDetail(id);
        setDetail(d);
      } catch (e: any) {
        setDetailError(e.message ?? 'Failed to load details');
      }
    });
  };

  const closeDetail = () => { setDetail(null); setDetailError(null); };

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-outline-variant bg-surface-bright flex items-center justify-between gap-2 rounded-t-xl">
          <h2 className="font-headline-md text-on-surface">Tests</h2>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            title="Toggle filters"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="border-b border-outline-variant bg-surface-container-low/50 p-4 flex flex-col gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                type="text"
                placeholder="Assessment or class…"
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-background placeholder:text-outline-variant"
              />
            </div>
            {cohortOptions.length > 0 && (
              <select
                value={cohortFilter}
                onChange={e => setCohortFilter(e.target.value)}
                className="text-[12px] py-1.5 px-2 rounded-md border border-outline-variant bg-surface text-on-surface w-full"
              >
                <option value="ALL">All classes</option>
                {cohortOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {filtersActive && (
              <button
                onClick={() => { setQuery(''); setCohortFilter('ALL'); }}
                className="text-[11px] text-primary hover:underline font-metric-label inline-flex items-center gap-1 self-start"
              >
                <span className="material-symbols-outlined text-[13px]">close</span>
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {assessments.length === 0 ? (
            <div className="py-10 text-center px-4">
              <span className="material-symbols-outlined text-4xl text-outline block mb-2">event_busy</span>
              <p className="font-body-md text-on-surface-variant text-sm">No tests scheduled yet.</p>
              <p className="font-caption text-outline mt-1 text-xs">Enroll students and schedule assessments to get started.</p>
            </div>
          ) : SECTIONS.map(({ cat, label, icon, iconCls, pillCls }) => {
            const items = buckets[cat];
            const isOpen = openSections[cat];
            return (
              <div key={cat} className="border-b border-outline-variant last:border-0">
                <button
                  onClick={() => setOpenSections(s => ({ ...s, [cat]: !s[cat] }))}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-container transition-colors text-left"
                >
                  <span className={`material-symbols-outlined text-[18px] ${iconCls}`}>{icon}</span>
                  <span className="font-metric-label text-on-surface text-sm font-semibold flex-1">{label}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${pillCls}`}>{items.length}</span>
                  <span
                    className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {items.length === 0 ? (
                      <p className="text-[12px] text-on-surface-variant text-center py-4">
                        {filtersActive ? 'No matches.' : `No ${label.toLowerCase()} tests.`}
                      </p>
                    ) : items.map(a => (
                      <AssessmentCard key={a.id} a={a} cat={cat} onClick={() => openDetail(a.id)} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-bright rounded-b-xl">
          <div className="flex justify-between text-xs font-metric-label text-on-surface-variant">
            <span>{buckets.upcoming.length} upcoming · {buckets.ongoing.length} ongoing</span>
            <span>{buckets.completed.length} completed</span>
          </div>
        </div>
      </div>

      {/* Detail drawer backdrop */}
      {detail !== null && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={closeDetail}
        />
      )}

      {/* Detail drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-110 bg-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          detail !== null ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {detail && (
          <>
            {/* Drawer header */}
            <div className="flex items-start justify-between gap-3 p-6 border-b border-outline-variant bg-surface-bright">
              <div className="min-w-0">
                {isPending && !detail.title ? (
                  <div className="h-6 w-48 bg-surface-container-high rounded animate-pulse mb-2" />
                ) : (
                  <h2 className="font-headline-md text-on-surface">{detail.title || '…'}</h2>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {detail.classLabel && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-xs font-medium">
                      <span className="material-symbols-outlined text-[13px]">meeting_room</span>
                      {detail.classLabel}
                    </span>
                  )}
                  {detail.domain && (
                    <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-metric-label text-on-surface-variant">{detail.domain}</span>
                  )}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-on-surface-variant flex-wrap">
                  {detail.scheduledAt && <span><span className="font-medium">Starts:</span> {new Date(detail.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                  {detail.dueDate && <span><span className="font-medium">Due:</span> {new Date(detail.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Instructions (if any) */}
            {detail.instructions && (
              <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant">
                <p className="text-xs text-on-surface-variant">{detail.instructions}</p>
              </div>
            )}

            {/* Student roster */}
            <div className="flex-1 overflow-y-auto">
              {detailError ? (
                <div className="p-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-error block mb-2">error</span>
                  <p className="text-sm text-on-surface-variant">{detailError}</p>
                </div>
              ) : isPending ? (
                <div className="p-6 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high" />
                      <div className="flex-1">
                        <div className="h-3.5 w-32 bg-surface-container-high rounded mb-1.5" />
                        <div className="h-3 w-20 bg-surface-container rounded" />
                      </div>
                      <div className="h-5 w-16 bg-surface-container-high rounded-full" />
                    </div>
                  ))}
                </div>
              ) : detail.students.length === 0 ? (
                <div className="py-12 text-center px-6">
                  <span className="material-symbols-outlined text-4xl text-outline block mb-2">person_off</span>
                  <p className="text-sm text-on-surface-variant">No students enrolled yet.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-bright">
                      <th className="px-5 py-3 font-metric-label text-on-surface-variant text-xs">Student</th>
                      <th className="px-5 py-3 font-metric-label text-on-surface-variant text-xs">Status</th>
                      <th className="px-5 py-3 font-metric-label text-on-surface-variant text-xs text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {detail.students.map(s => {
                      const initials = getInitials(s.name);
                      return (
                        <tr key={s.testId} className="hover:bg-surface-container transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-xs font-bold shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-body-md text-sm text-on-surface font-medium truncate">{s.name}</p>
                                {s.className && <p className="font-caption text-on-surface-variant text-[11px]">{s.className}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <StatusPill status={s.status} />
                            {s.completedAt && (
                              <p className="font-caption text-on-surface-variant text-[10px] mt-0.5">{formatAbs(s.completedAt)}</p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {s.score !== null ? (
                              <div>
                                <span className="font-metric-label text-on-surface text-sm">{s.score}%</span>
                                {s.correct !== null && s.totalQ !== null && (
                                  <p className="font-caption text-on-surface-variant text-[10px]">{s.correct}/{s.totalQ} correct</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-on-surface-variant/40 text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
