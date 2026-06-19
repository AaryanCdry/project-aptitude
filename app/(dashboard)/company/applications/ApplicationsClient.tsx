'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateApplicationStatus } from '@/app/actions/company';

type Application = {
  id: string;
  job_id: string;
  status: string;
  applied_at: string;
  student_snapshot: Record<string, unknown> | null;
  job_postings: unknown;
};

type Job = { id: string; title: string };

const STATUS_STYLE: Record<string, string> = {
  applied:     'bg-primary/10 text-primary border-primary/20',
  shortlisted: 'bg-secondary/10 text-secondary border-secondary/20',
  rejected:    'bg-error/10 text-error border-error/20',
};

export default function ApplicationsClient({
  initialApplications,
  jobs,
  selectedJobId,
}: {
  initialApplications: Application[];
  jobs: Job[];
  selectedJobId: string | null;
}) {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusUpdate(appId: string, status: 'applied' | 'shortlisted' | 'rejected') {
    startTransition(async () => {
      const res = await updateApplicationStatus(appId, status);
      if ('success' in res) {
        setApplications(apps => apps.map(a => a.id === appId ? { ...a, status } : a));
        if (selectedApp?.id === appId) setSelectedApp(prev => prev ? { ...prev, status } : null);
      }
    });
  }

  const snapshot = (app: Application) => (app.student_snapshot ?? {}) as Record<string, unknown>;

  return (
    <div className="flex gap-4">
      {/* Left: list */}
      <div className="flex-1 min-w-0">
        {/* Job filter */}
        <div className="mb-4">
          <select
            value={selectedJobId ?? ''}
            onChange={e => router.push(e.target.value ? `/company/applications?job=${e.target.value}` : '/company/applications')}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface text-sm focus:outline-none focus:border-primary"
          >
            <option value="">All Jobs</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        {applications.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-10 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl block mb-2 opacity-40">inbox</span>
            <p className="font-body-md text-sm">No applications yet.</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="divide-y divide-outline-variant">
              {applications.map(app => {
                const snap = snapshot(app);
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(isSelected ? null : app)}
                    className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-surface-container-low/40'}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm shrink-0">
                      {String(snap.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{String(snap.name ?? 'Unknown')}</p>
                      <p className="font-caption text-on-surface-variant text-xs truncate">
                        {snap.courseType ? String(snap.courseType) : ''}{snap.department ? ` · ${snap.department}` : ''}
                        {snap.year ? ` · Year ${snap.year}` : ''}
                      </p>
                    </div>
                    {snap.avgScore != null && (
                      <span className="font-caption text-secondary text-xs font-bold shrink-0">{String(snap.avgScore)}%</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-metric-label border capitalize shrink-0 ${STATUS_STYLE[app.status] ?? ''}`}>
                      {app.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: detail drawer */}
      {selectedApp && (() => {
        const snap = snapshot(selectedApp);
        const scores = (snap.scores as { domain: string; score: number }[]) ?? [];
        return (
          <div className="w-80 shrink-0 bg-surface-container-lowest border border-outline-variant rounded-xl p-5 sticky top-6 self-start h-fit">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-metric-label text-on-surface font-bold">{String(snap.name ?? '')}</p>
                <p className="font-caption text-on-surface-variant text-xs">{String(snap.email ?? '')}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mb-4 text-sm">
              {!!snap.courseType && <p className="font-caption text-on-surface-variant"><span className="font-metric-label text-on-surface">Degree:</span> {String(snap.courseType)}</p>}
              {!!snap.department && <p className="font-caption text-on-surface-variant"><span className="font-metric-label text-on-surface">Dept:</span> {String(snap.department)}</p>}
              {!!snap.className && <p className="font-caption text-on-surface-variant"><span className="font-metric-label text-on-surface">Class:</span> {String(snap.className)}</p>}
              {!!snap.batch && <p className="font-caption text-on-surface-variant"><span className="font-metric-label text-on-surface">Batch:</span> {String(snap.batch)}</p>}
              {snap.avgScore != null && (
                <p className="font-caption text-on-surface-variant"><span className="font-metric-label text-on-surface">Avg Score:</span> <span className="text-secondary font-bold">{String(snap.avgScore)}%</span></p>
              )}
            </div>

            {scores.length > 0 && (
              <div className="mb-4">
                <p className="font-metric-label text-on-surface-variant text-xs uppercase tracking-wider mb-2">Domain Scores</p>
                <div className="flex flex-col gap-1.5">
                  {scores.map(s => (
                    <div key={s.domain} className="flex items-center gap-2">
                      <p className="font-caption text-on-surface-variant text-xs w-24 shrink-0">{s.domain}</p>
                      <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${s.score}%` }} />
                      </div>
                      <p className="font-caption text-on-surface-variant text-xs w-8 text-right">{s.score}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="font-caption text-on-surface-variant text-xs mb-3">
              Applied {new Date(selectedApp.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate(selectedApp.id, 'shortlisted')}
                disabled={isPending || selectedApp.status === 'shortlisted'}
                className="flex-1 py-2 rounded-lg bg-secondary text-on-secondary font-metric-label text-xs hover:bg-secondary/90 transition-colors disabled:opacity-40"
              >
                Shortlist
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                disabled={isPending || selectedApp.status === 'rejected'}
                className="flex-1 py-2 rounded-lg border border-error text-error font-metric-label text-xs hover:bg-error/10 transition-colors disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
