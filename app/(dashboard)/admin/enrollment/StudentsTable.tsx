'use client';

import React, { useMemo, useState } from 'react';
import StudentActions from './StudentActions';
import MultiSelectDropdown from '@/app/(dashboard)/admin/_shared/MultiSelectDropdown';

const AVATAR_COLORS = [
  'bg-primary-fixed-dim text-on-primary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  'bg-secondary-fixed text-on-secondary-fixed',
];

const PAGE_SIZE = 10;

type Student = {
  id: string;
  name: string | null;
  email: string;
  registration_id: string | null;
  section: string | null;
  semester: number | null;
  temp_password: string | null;
  created_at: string;
  department_id: string | null;
  class_id: string | null;
  departmentName: string | null;
  className: string | null;
  classYear: number | null;
  batchName: string | null;
  academicYearName: string | null;
  status: string;
  dateEnrolled: string;
  platformId: string;
};

type Department = { id: string; name: string; };
type ClassRow = { id: string; name: string; dept_id: string; };

type SortKey =
  | 'name'
  | 'registration_id'
  | 'department'
  | 'class'
  | 'batch'
  | 'academic-year'
  | 'section'
  | 'enrolled'
  | 'status';

interface Props {
  students: Student[];
  totalEnrolled: number;
  departments: Department[];
  classes: ClassRow[];
}

const cmpStr = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });

export default function StudentsTable({ students, totalEnrolled, departments, classes }: Props) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'invited'>('all');
  const [deptSel, setDeptSel] = useState<string[]>([]);
  const [classSel, setClassSel] = useState<string[]>([]);
  const [batchSel, setBatchSel] = useState<string[]>([]);
  const [academicYearSel, setAcademicYearSel] = useState<string[]>([]);
  const [sectionSel, setSectionSel] = useState<string[]>([]);   // may include '__NONE__'
  const [yearSel, setYearSel] = useState<string[]>([]);         // class year (stringified)
  const [semesterSel, setSemesterSel] = useState<string[]>([]); // student semester (stringified)
  const [statusSel, setStatusSel] = useState<string[]>([]);     // 'ACTIVE' | 'INVITED'
  const [sortBy, setSortBy] = useState<SortKey>('enrolled');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Unique values for the dropdowns
  const { deptOptions, classOptions, batchOptions, academicYearOptions, sectionOptions, yearOptions, semesterOptions } = useMemo(() => {
    const d = new Set<string>();
    const c = new Set<string>();
    const b = new Set<string>();
    const ay = new Set<string>();
    const s = new Set<string>();
    const y = new Set<number>();
    const sem = new Set<number>();
    let hasNullSection = false;
    students.forEach(st => {
      if (st.departmentName) d.add(st.departmentName);
      if (st.className) c.add(st.className);
      if (st.batchName) b.add(st.batchName);
      if (st.academicYearName) ay.add(st.academicYearName);
      if (st.section) s.add(st.section); else hasNullSection = true;
      if (st.classYear != null) y.add(st.classYear);
      if (st.semester != null) sem.add(st.semester);
    });
    return {
      deptOptions: [...d].sort().map(v => ({ value: v, label: v })),
      classOptions: [...c].sort().map(v => ({ value: v, label: v })),
      batchOptions: [...b].sort().map(v => ({ value: v, label: v })),
      academicYearOptions: [...ay].sort().map(v => ({ value: v, label: v })),
      sectionOptions: [...s].sort().map(v => ({ value: v, label: v }))
        .concat(hasNullSection ? [{ value: '__NONE__', label: 'No section' }] : []),
      yearOptions: [...y].sort((a, b) => a - b).map(v => ({ value: String(v), label: `Year ${v}` })),
      semesterOptions: [...sem].sort((a, b) => a - b).map(v => ({ value: String(v), label: `Semester ${v}` })),
    };
  }, [students]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = students;

    if (q) {
      rows = rows.filter(s =>
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.registration_id ?? '').toLowerCase().includes(q) ||
        (s.platformId ?? '').toLowerCase().includes(q)
      );
    }
    if (tab === 'active') rows = rows.filter(s => s.status === 'ACTIVE');
    if (tab === 'invited') rows = rows.filter(s => s.status === 'INVITED');

    if (deptSel.length > 0)   rows = rows.filter(s => s.departmentName != null && deptSel.includes(s.departmentName));
    if (classSel.length > 0)  rows = rows.filter(s => s.className != null && classSel.includes(s.className));
    if (batchSel.length > 0)  rows = rows.filter(s => s.batchName != null && batchSel.includes(s.batchName));
    if (academicYearSel.length > 0) rows = rows.filter(s => s.academicYearName != null && academicYearSel.includes(s.academicYearName));
    if (sectionSel.length > 0) rows = rows.filter(s =>
      (s.section && sectionSel.includes(s.section)) ||
      (!s.section && sectionSel.includes('__NONE__'))
    );
    if (yearSel.length > 0)    rows = rows.filter(s => s.classYear != null && yearSel.includes(String(s.classYear)));
    if (semesterSel.length > 0) rows = rows.filter(s => s.semester != null && semesterSel.includes(String(s.semester)));
    if (statusSel.length > 0) {
      rows = rows.filter(s => statusSel.includes(s.status));
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case 'name':            return dir * cmpStr(a.name, b.name);
        case 'registration_id': return dir * cmpStr(a.registration_id, b.registration_id);
        case 'department':      return dir * cmpStr(a.departmentName, b.departmentName);
        case 'class':           return dir * cmpStr(a.className, b.className);
        case 'batch':           return dir * cmpStr(a.batchName, b.batchName);
        case 'academic-year':   return dir * cmpStr(a.academicYearName, b.academicYearName);
        case 'section':         return dir * cmpStr(a.section, b.section);
        case 'status':          return dir * cmpStr(a.status, b.status);
        case 'enrolled':
        default:
          return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });
    return rows;
  }, [students, query, tab, deptSel, classSel, batchSel, academicYearSel, sectionSel, yearSel, semesterSel, statusSel, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const filtersActive =
    query !== '' ||
    tab !== 'all' ||
    deptSel.length > 0 ||
    classSel.length > 0 ||
    batchSel.length > 0 ||
    academicYearSel.length > 0 ||
    sectionSel.length > 0 ||
    yearSel.length > 0 ||
    semesterSel.length > 0 ||
    statusSel.length > 0;

  const clearFilters = () => {
    setQuery('');
    setTab('all');
    setDeptSel([]);
    setClassSel([]);
    setBatchSel([]);
    setAcademicYearSel([]);
    setSectionSel([]);
    setYearSel([]);
    setSemesterSel([]);
    setStatusSel([]);
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'enrolled' ? 'desc' : 'asc');
    }
    setPage(1);
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
    <th className="py-3 px-4 font-metric-label text-on-surface-variant text-[11px] uppercase tracking-wider whitespace-nowrap">
      <button
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 hover:text-on-surface transition-colors"
      >
        {label}
        {sortIcon(key)}
      </button>
    </th>
  );

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Toolbar — tabs + search */}
      <div className="px-5 py-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-bright">
        <div className="flex space-x-1 border border-outline-variant rounded-lg p-1 bg-surface-container-low">
          {(
            [
              ['all', 'All Students'],
              ['active', 'Active'],
              ['invited', 'Invited'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1); }}
              className={`px-4 py-1.5 font-metric-label text-[13px] rounded-md transition-colors ${
                tab === key
                  ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/50'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-background placeholder:text-outline-variant transition-colors"
            placeholder="Search by name, email or ID…"
            type="text"
          />
        </div>
      </div>

      {/* Filter row — multi-select per dimension */}
      <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-low/40 flex flex-wrap items-center gap-2">
        <MultiSelectDropdown label="Department" options={deptOptions} selected={deptSel} onChange={v => { setDeptSel(v); setPage(1); }} />
        <MultiSelectDropdown label="Class" options={classOptions} selected={classSel} onChange={v => { setClassSel(v); setPage(1); }} />
        <MultiSelectDropdown label="Batch" options={batchOptions} selected={batchSel} onChange={v => { setBatchSel(v); setPage(1); }} emptyOptionsLabel="No batch data" />
        <MultiSelectDropdown label="Acad. Year" options={academicYearOptions} selected={academicYearSel} onChange={v => { setAcademicYearSel(v); setPage(1); }} emptyOptionsLabel="No academic year data" />
        <MultiSelectDropdown label="Section" options={sectionOptions} selected={sectionSel} onChange={v => { setSectionSel(v); setPage(1); }} />
        <MultiSelectDropdown label="Year" options={yearOptions} selected={yearSel} onChange={v => { setYearSel(v); setPage(1); }} emptyOptionsLabel="No year data" />
        <MultiSelectDropdown label="Semester" options={semesterOptions} selected={semesterSel} onChange={v => { setSemesterSel(v); setPage(1); }} emptyOptionsLabel="No semester data" />
        <MultiSelectDropdown
          label="Status"
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'INVITED', label: 'Invited' },
          ]}
          selected={statusSel}
          onChange={v => { setStatusSel(v); setPage(1); }}
        />
        {filtersActive && (
          <button
            onClick={clearFilters}
            className="ml-auto text-[12px] text-primary hover:underline font-metric-label inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-outline-variant">
              {headerCell('Student', 'name')}
              {headerCell('Reg. ID', 'registration_id')}
              {headerCell('Department', 'department')}
              {headerCell('Class', 'class')}
              {headerCell('Batch', 'batch')}
              {headerCell('Acad. Year', 'academic-year')}
              {headerCell('Section', 'section')}
              {headerCell('Enrolled', 'enrolled')}
              {headerCell('Status', 'status')}
              <th className="py-3 px-4 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/60">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl block mb-3 text-outline">
                    {students.length === 0 ? 'person_off' : 'search_off'}
                  </span>
                  <p className="font-body-md">
                    {students.length === 0 ? 'No students enrolled yet.' : 'No matches for the current filters.'}
                  </p>
                  {students.length === 0 ? (
                    <p className="font-caption text-on-surface-variant/60 mt-1">Use the buttons above to get started.</p>
                  ) : (
                    <button onClick={clearFilters} className="text-primary text-sm font-metric-label hover:underline mt-2">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            ) : paginated.map((student, idx) => {
              const initials = (student.name || student.email || 'U')
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
              const ci = (student.name?.charCodeAt(0) ?? (pageStart + idx)) % 3;
              return (
                <tr key={student.id} className="hover:bg-surface-container/40 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${AVATAR_COLORS[ci]}`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[13px] text-on-background group-hover:text-primary transition-colors truncate">
                          {student.name || '—'}
                        </p>
                        <p className="text-[11px] text-on-surface-variant truncate">{student.email}</p>
                        <p className="text-[10px] text-on-surface-variant/50 font-mono">{student.platformId}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {student.registration_id ? (
                      <span className="font-mono text-[12px] text-on-surface bg-surface-container px-2 py-1 rounded-md border border-outline-variant">
                        {student.registration_id}
                      </span>
                    ) : (
                      <span className="text-outline/50 text-sm">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-[13px] text-on-surface">
                    {student.departmentName ?? <span className="text-outline/50">—</span>}
                  </td>

                  <td className="py-3 px-4 text-[12px] text-on-surface-variant">
                    {student.className ?? <span className="text-outline/50">—</span>}
                  </td>

                  <td className="py-3 px-4">
                    {student.batchName ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <span className="material-symbols-outlined text-[12px]">groups</span>
                        {student.batchName}
                      </span>
                    ) : (
                      <span className="text-outline/50 text-sm">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {student.academicYearName ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary bg-secondary/8 border border-secondary/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                        {student.academicYearName}
                      </span>
                    ) : (
                      <span className="text-outline/50 text-sm">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {student.section ? (
                      <span className="text-[12px] font-medium text-on-surface bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-variant">
                        {student.section}
                      </span>
                    ) : (
                      <span className="text-outline/50 text-sm">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-[12px] text-on-surface-variant whitespace-nowrap">
                    {student.dateEnrolled}
                  </td>

                  <td className="py-3 px-4">
                    {student.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary-fixed/60 text-on-secondary-fixed-variant border border-secondary-fixed-dim">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        ACTIVE
                      </span>
                    ) : student.status === 'INVITED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        INVITED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                        INACTIVE
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <StudentActions
                      student={student}
                      departments={departments}
                      classes={classes}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="px-5 py-3.5 border-t border-outline-variant bg-surface-bright flex items-center justify-between flex-wrap gap-3">
        <span className="text-[12px] text-on-surface-variant">
          {filtered.length === 0 ? (
            <>Showing <span className="font-semibold text-on-surface">0</span> of <span className="font-semibold text-on-surface">{totalEnrolled}</span> students</>
          ) : (
            <>
              Showing <span className="font-semibold text-on-surface">{pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filtered.length)}</span>
              {' '}of <span className="font-semibold text-on-surface">{filtered.length}</span>
              {filtered.length !== totalEnrolled && (
                <span className="text-on-surface-variant"> (filtered from {totalEnrolled})</span>
              )}
            </>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg border border-outline-variant text-on-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <span className="px-3 py-1 text-[12px] font-medium text-primary bg-primary/8 rounded-lg border border-primary/20">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-lg border border-outline-variant text-on-surface disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
