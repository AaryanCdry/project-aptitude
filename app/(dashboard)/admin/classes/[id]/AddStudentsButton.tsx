'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addStudentsToClass } from '@/app/actions/mapping';
import MultiSelectDropdown from '@/app/(dashboard)/admin/_shared/MultiSelectDropdown';

type Candidate = {
  id: string;
  name: string | null;
  email: string;
  registration_id: string | null;
  section: string | null;
  semester: number | null;
  currentClassName: string | null;
  currentClassYear: number | null;
  currentDeptName: string | null;
};

type SortKey = 'name' | 'email' | 'registration_id' | 'currentClassName';
const cmpStr = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });

export default function AddStudentsButton({
  classId,
  className,
  candidates,
}: {
  classId: string;
  className: string;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [classStatus, setClassStatus] = useState<string[]>([]);     // 'UNASSIGNED' | 'OTHER'
  const [deptSel, setDeptSel] = useState<string[]>([]);
  const [sectionSel, setSectionSel] = useState<string[]>([]);       // can include '__NONE__'
  const [yearSel, setYearSel] = useState<string[]>([]);             // class year, stringified
  const [semesterSel, setSemesterSel] = useState<string[]>([]);     // student semester, stringified
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Build dropdown option lists from the candidate pool.
  const { deptOptions, sectionOptions, yearOptions, semesterOptions } = useMemo(() => {
    const depts = new Set<string>();
    const sections = new Set<string>();
    const years = new Set<number>();
    const semesters = new Set<number>();
    let hasNullSection = false;
    candidates.forEach(c => {
      if (c.currentDeptName) depts.add(c.currentDeptName);
      if (c.section) sections.add(c.section); else hasNullSection = true;
      if (c.currentClassYear != null) years.add(c.currentClassYear);
      if (c.semester != null) semesters.add(c.semester);
    });
    return {
      deptOptions: [...depts].sort().map(d => ({ value: d, label: d })),
      sectionOptions: [...sections].sort().map(s => ({ value: s, label: s }))
        .concat(hasNullSection ? [{ value: '__NONE__', label: 'No section' }] : []),
      yearOptions: [...years].sort((a, b) => a - b).map(y => ({ value: String(y), label: `Year ${y}` })),
      semesterOptions: [...semesters].sort((a, b) => a - b).map(s => ({ value: String(s), label: `Semester ${s}` })),
    };
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = candidates;
    if (q) {
      rows = rows.filter(s =>
        (s.name ?? '').toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.registration_id ?? '').toLowerCase().includes(q)
      );
    }
    if (classStatus.length > 0) {
      rows = rows.filter(s => {
        const inOther = !!s.currentClassName;
        return (classStatus.includes('UNASSIGNED') && !inOther)
            || (classStatus.includes('OTHER') && inOther);
      });
    }
    if (deptSel.length > 0)    rows = rows.filter(s => s.currentDeptName != null && deptSel.includes(s.currentDeptName));
    if (sectionSel.length > 0) rows = rows.filter(s =>
      (s.section && sectionSel.includes(s.section)) ||
      (!s.section && sectionSel.includes('__NONE__'))
    );
    if (yearSel.length > 0)    rows = rows.filter(s => s.currentClassYear != null && yearSel.includes(String(s.currentClassYear)));
    if (semesterSel.length > 0) rows = rows.filter(s => s.semester != null && semesterSel.includes(String(s.semester)));

    const dir = sortDir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case 'email':           return dir * cmpStr(a.email, b.email);
        case 'registration_id': return dir * cmpStr(a.registration_id, b.registration_id);
        case 'currentClassName':return dir * cmpStr(a.currentClassName, b.currentClassName);
        case 'name':
        default:                return dir * cmpStr(a.name, b.name);
      }
    });
    return rows;
  }, [candidates, query, classStatus, deptSel, sectionSel, yearSel, semesterSel, sortBy, sortDir]);

  const anyFilterActive =
    query !== '' || classStatus.length || deptSel.length || sectionSel.length || yearSel.length || semesterSel.length;
  const clearAll = () => {
    setQuery(''); setClassStatus([]); setDeptSel([]); setSectionSel([]); setYearSel([]); setSemesterSel([]);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selected.has(s.id));
  const toggleAllFiltered = () => {
    const next = new Set(selected);
    if (allFilteredSelected) {
      filtered.forEach(s => next.delete(s.id));
    } else {
      filtered.forEach(s => next.add(s.id));
    }
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    startTransition(async () => {
      const res = await addStudentsToClass(classId, [...selected]);
      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
      } else {
        setFlash({ kind: 'ok', text: `Added ${(res as any).added} student${(res as any).added === 1 ? '' : 's'} to ${className}.` });
        setSelected(new Set());
        setQuery('');
        router.refresh();
        setTimeout(() => setOpen(false), 1200);
      }
    });
  };

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

  return (
    <>
      <button
        onClick={() => { setOpen(true); setFlash(null); }}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-primary/90 transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[18px]">person_add</span>
        Add Students
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container rounded-2xl border border-outline-variant shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h2 className="font-headline-md text-on-surface text-lg">Add students to {className}</h2>
                <p className="font-caption text-on-surface-variant mt-0.5">
                  Pick from students already enrolled in your scope. Selected students are moved to this class.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Toolbar — search + multi-select filters */}
            <div className="px-6 py-3 border-b border-outline-variant flex flex-col gap-3">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  type="text"
                  placeholder="Search by name, email or reg ID…"
                  className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-background placeholder:text-outline-variant"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <MultiSelectDropdown label="Department" options={deptOptions} selected={deptSel} onChange={setDeptSel} />
                <MultiSelectDropdown label="Section" options={sectionOptions} selected={sectionSel} onChange={setSectionSel} />
                <MultiSelectDropdown label="Year" options={yearOptions} selected={yearSel} onChange={setYearSel} emptyOptionsLabel="No year data" />
                <MultiSelectDropdown label="Semester" options={semesterOptions} selected={semesterSel} onChange={setSemesterSel} emptyOptionsLabel="No semester data" />
                <MultiSelectDropdown
                  label="Status"
                  options={[
                    { value: 'UNASSIGNED', label: 'No class yet' },
                    { value: 'OTHER', label: 'In another class' },
                  ]}
                  selected={classStatus}
                  onChange={setClassStatus}
                />
                {anyFilterActive && (
                  <button
                    onClick={clearAll}
                    className="ml-auto text-[12px] text-primary hover:underline font-metric-label inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Flash */}
            {flash && (
              <div className={`mx-6 mt-3 px-4 py-2 rounded-lg text-sm ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed-variant' : 'bg-error-container text-on-error-container'}`}>
                {flash.text}
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-6 py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2 text-outline">
                    {candidates.length === 0 ? 'person_off' : 'search_off'}
                  </span>
                  {candidates.length === 0
                    ? 'No eligible students. Enroll new students from the Enrollment page first.'
                    : 'No matches for the current search.'}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-container z-10">
                    <tr className="border-b border-outline-variant">
                      <th className="py-2 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleAllFiltered}
                          aria-label="Select all"
                        />
                      </th>
                      <th className="py-2 px-3 font-metric-label text-on-surface-variant text-[11px] uppercase">
                        <button onClick={() => toggleSort('name')} className="inline-flex items-center gap-1">
                          Name {sortIcon('name')}
                        </button>
                      </th>
                      <th className="py-2 px-3 font-metric-label text-on-surface-variant text-[11px] uppercase">
                        <button onClick={() => toggleSort('email')} className="inline-flex items-center gap-1">
                          Email {sortIcon('email')}
                        </button>
                      </th>
                      <th className="py-2 px-3 font-metric-label text-on-surface-variant text-[11px] uppercase">
                        <button onClick={() => toggleSort('registration_id')} className="inline-flex items-center gap-1">
                          Reg ID {sortIcon('registration_id')}
                        </button>
                      </th>
                      <th className="py-2 px-3 font-metric-label text-on-surface-variant text-[11px] uppercase">
                        <button onClick={() => toggleSort('currentClassName')} className="inline-flex items-center gap-1">
                          Current class {sortIcon('currentClassName')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filtered.map(s => (
                      <tr key={s.id} className={`hover:bg-surface-container-low transition-colors ${selected.has(s.id) ? 'bg-primary/5' : ''}`}>
                        <td className="py-2 px-4">
                          <input
                            type="checkbox"
                            checked={selected.has(s.id)}
                            onChange={() => toggleOne(s.id)}
                          />
                        </td>
                        <td className="py-2 px-3 font-body-md text-on-surface">{s.name ?? '—'}</td>
                        <td className="py-2 px-3 font-caption text-on-surface-variant">{s.email}</td>
                        <td className="py-2 px-3">
                          {s.registration_id ? (
                            <span className="font-mono text-[11px] bg-surface-container px-2 py-0.5 rounded border border-outline-variant">{s.registration_id}</span>
                          ) : <span className="text-on-surface-variant/40 text-sm">—</span>}
                        </td>
                        <td className="py-2 px-3 text-[12px] text-on-surface-variant">
                          {s.currentClassName ?? <span className="italic">Unassigned</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between gap-3 bg-surface-bright">
              <span className="text-[12px] text-on-surface-variant">
                {selected.size > 0 ? `${selected.size} selected` : 'Select students to add'}
                {' · '}
                <span className="text-on-surface">{filtered.length}</span> shown
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-metric-label text-sm hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={pending || selected.size === 0}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {pending && <span className="material-symbols-outlined text-sm animate-spin">refresh</span>}
                  {pending ? 'Adding…' : `Add ${selected.size || ''} to class`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
