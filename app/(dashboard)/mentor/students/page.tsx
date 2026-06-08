import React from 'react';
import Link from 'next/link';
import { getMentorDashboard, getStudentDetail } from '@/app/actions/mentor';
import { getInitials } from '@/lib/utils';

const DOMAIN_COLOR: Record<string, string> = {
  REASONING:    'bg-primary/10 text-primary border-primary/20',
  QUANTITATIVE: 'bg-secondary/10 text-secondary border-secondary/20',
  LOGICAL:      'bg-primary/10 text-primary border-primary/20',
  VERBAL:       'bg-tertiary/10 text-tertiary border-tertiary/20',
};

function InitialsAvatar({ name }: { name: string }) {
  const initials = getInitials(name);
  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 text-sm">
      {initials}
    </div>
  );
}

export default async function MentorStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; q?: string; classId?: string }>;
}) {
  const { id: selectedId, q: query, classId } = await searchParams;
  const { students } = await getMentorDashboard();

  let filtered = students;
  if (classId) filtered = filtered.filter((s: any) => s.class_id === classId);
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((s: any) =>
      s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }

  const detail = selectedId ? await getStudentDetail(selectedId) : null;

  return (
    <div className="flex h-full">
      {/* Sidebar list */}
      <div className="w-72 shrink-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col overflow-hidden">
        <div className="p-4 border-b border-outline-variant">
          <h2 className="font-headline-md text-on-surface font-semibold mb-3">Students</h2>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
            <form>
              <input
                name="q"
                defaultValue={query}
                type="text"
                placeholder="Search students…"
                className="w-full pl-9 pr-4 py-2 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </form>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-outline-variant">
          {filtered.length === 0 && (
            <p className="p-4 text-on-surface-variant font-caption text-center">No students found.</p>
          )}
          {filtered.map((s: any) => (
            <Link
              key={s.id}
              href={`/mentor/students?id=${s.id}${query ? `&q=${query}` : ''}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors ${selectedId === s.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
            >
              <InitialsAvatar name={s.name ?? s.email} />
              <div className="min-w-0">
                <p className="font-body-md font-semibold text-on-surface truncate">{s.name ?? '—'}</p>
                <p className="font-caption text-on-surface-variant truncate">{s.email}</p>
                <div className="flex gap-2 mt-0.5">
                  {s.isAtRisk && (
                    <span className="text-[10px] text-error flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">warning</span>At Risk
                    </span>
                  )}
                  {s.avgScore !== null && (
                    <span className={`text-[10px] font-bold ${s.avgScore >= 75 ? 'text-secondary' : s.avgScore >= 50 ? 'text-primary' : 'text-error'}`}>
                      {s.avgScore}%
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Detail pane */}
      <div className="flex-1 overflow-y-auto p-6">
        {!detail ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-5xl text-outline mb-3">person_search</span>
            <p className="font-headline-md text-on-surface mb-1">Select a student</p>
            <p className="font-body-md text-on-surface-variant">Click on any student from the list to see their progress.</p>
          </div>
        ) : (
          <div className="max-w-2xl">
            {/* Student header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                {getInitials(detail.student?.name ?? detail.student?.email)}
              </div>
              <div className="flex-1">
                <h1 className="font-headline-md text-on-surface text-[22px] font-bold">{detail.student?.name ?? '—'}</h1>
                <p className="font-body-md text-on-surface-variant">{detail.student?.email}</p>
                <p className="font-caption text-outline">Joined {new Date(detail.student?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
              {selectedId && (
                <Link
                  href={`/mentor/students/${selectedId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-metric-label text-sm hover:bg-primary/90 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">dashboard</span>
                  View Full Dashboard
                </Link>
              )}
            </div>

            {/* Domain summary */}
            <h2 className="font-headline-md text-on-surface font-semibold mb-3">Domain Performance</h2>
            {detail.domainSummary.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center mb-6">
                <p className="font-body-md text-on-surface-variant">No test data yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {detail.domainSummary.map((d: any) => {
                  const cls = DOMAIN_COLOR[d.domain] ?? DOMAIN_COLOR.REASONING;
                  return (
                    <div key={d.domain} className={`border rounded-xl p-4 ${cls}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide">{d.domain}</span>
                        <span className="text-[11px] bg-surface-container-lowest px-1.5 py-0.5 rounded text-on-surface">L{d.level}</span>
                      </div>
                      <p className="font-display-sm text-[26px] font-bold">{d.avg}%</p>
                      <div className="mt-2 h-1.5 w-full bg-surface-container-lowest/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${d.avg}%` }} />
                      </div>
                      <p className="font-caption mt-1 opacity-70">{d.count} test{d.count !== 1 ? 's' : ''}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Test History — one row per test, with overall + per-domain breakdown */}
            <h2 className="font-headline-md text-on-surface font-semibold mb-3">Test History</h2>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-bright">
                    {['Date', 'Overall', 'Domain breakdown'].map(h => (
                      <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {detail.testHistory.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-on-surface-variant font-caption">No tests yet.</td></tr>
                  ) : detail.testHistory.slice(0, 15).map((t: any) => (
                    <tr key={t.test_id} className="hover:bg-surface-container transition-colors">
                      <td className="py-3 px-5 font-caption text-on-surface-variant">
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-5">
                        {t.overall != null ? (
                          <span className={`font-bold ${t.overall >= 75 ? 'text-secondary' : t.overall >= 50 ? 'text-primary' : 'text-error'}`}>
                            {t.overall}%
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/60">—</span>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-wrap gap-1">
                          {t.domains.map((d: any) => (
                            <span
                              key={d.domain}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${DOMAIN_COLOR[d.domain] ?? ''}`}
                              title={`${d.domain}: ${d.score}%`}
                            >
                              {d.domain.slice(0, 3)} {d.score}%
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
