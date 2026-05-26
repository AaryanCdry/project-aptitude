'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

type Student = {
  id: string;
  name: string | null;
  email: string;
  registration_id: string | null;
  section: string | null;
};

const COLORS = [
  'bg-primary-fixed-dim text-on-primary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  'bg-secondary-fixed text-on-secondary-fixed',
];

type SortKey = 'name' | 'email' | 'registration_id' | 'section';
const cmpStr = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });

export default function ClassRosterTable({ students }: { students: Student[] }) {
  const [query, setQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sections = useMemo(() => {
    const s = new Set<string>();
    let hasNull = false;
    students.forEach(st => st.section ? s.add(st.section) : (hasNull = true));
    return [...s].sort().concat(hasNull ? ['__NONE__'] : []);
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = students;
    if (q) {
      rows = rows.filter(s =>
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.registration_id ?? '').toLowerCase().includes(q)
      );
    }
    if (sectionFilter !== 'ALL') {
      rows = sectionFilter === '__NONE__'
        ? rows.filter(s => !s.section)
        : rows.filter(s => s.section === sectionFilter);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case 'email':           return dir * cmpStr(a.email, b.email);
        case 'registration_id': return dir * cmpStr(a.registration_id, b.registration_id);
        case 'section':         return dir * cmpStr(a.section, b.section);
        case 'name':
        default:                return dir * cmpStr(a.name, b.name);
      }
    });
    return rows;
  }, [students, query, sectionFilter, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortBy !== key) return <span className="material-symbols-outlined text-[14px] opacity-30">unfold_more</span>;
    return (
      <span className="material-symbols-outlined text-[14px] text-primary">
        {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  const headerCell = (label: string, key: SortKey) => (
    <th className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">
      <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-on-surface transition-colors">
        {label}
        {sortIcon(key)}
      </button>
    </th>
  );

  const filtersActive = query !== '' || sectionFilter !== 'ALL';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-outline-variant flex flex-col gap-3">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h2 className="font-headline-md text-on-surface">Student Roster</h2>
          <span className="font-caption text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
            {filtered.length === students.length
              ? `${students.length} student${students.length === 1 ? '' : 's'}`
              : `${filtered.length} of ${students.length} students`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-50 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              type="text"
              placeholder="Search by name, email or reg ID…"
              className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-background placeholder:text-outline-variant transition-colors"
            />
          </div>
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="text-[12px] py-1.5 px-2 rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface"
          >
            <option value="ALL">All sections</option>
            {sections.map(s => <option key={s} value={s}>{s === '__NONE__' ? 'No section' : s}</option>)}
          </select>
          {filtersActive && (
            <button
              onClick={() => { setQuery(''); setSectionFilter('ALL'); }}
              className="text-[12px] text-primary hover:underline font-metric-label inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-bright">
              {headerCell('Student', 'name')}
              {headerCell('Email', 'email')}
              {headerCell('Reg ID', 'registration_id')}
              {headerCell('Section', 'section')}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2 text-outline">
                    {students.length === 0 ? 'person_off' : 'search_off'}
                  </span>
                  {students.length === 0 ? 'No students in this class yet.' : 'No matches.'}
                </td>
              </tr>
            ) : filtered.map((s, i) => {
              const initials = (s.name || s.email || 'U').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
              const ci = (s.name?.charCodeAt(0) ?? i) % 3;
              return (
                <tr key={s.id} className="hover:bg-surface-container transition-colors group">
                  <td className="py-3 px-5">
                    <Link href={`/admin/students/${s.id}`} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${COLORS[ci]}`}>{initials}</div>
                      <span className="font-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">{s.name || '—'}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-5 font-caption text-on-surface-variant">{s.email}</td>
                  <td className="py-3 px-5">
                    {s.registration_id ? (
                      <span className="font-mono text-sm bg-surface-container px-2 py-0.5 rounded border border-outline-variant">{s.registration_id}</span>
                    ) : (
                      <span className="text-on-surface-variant/40 text-sm">—</span>
                    )}
                  </td>
                  <td className="py-3 px-5">
                    {s.section ? (
                      <span className="text-sm font-medium bg-surface-container px-2 py-0.5 rounded-full border border-outline-variant">{s.section}</span>
                    ) : (
                      <span className="text-on-surface-variant/40 text-sm">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
