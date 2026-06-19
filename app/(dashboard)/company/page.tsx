import Link from 'next/link';
import { getMyApplicationStats } from '@/app/actions/company';

const STATUS_STYLE: Record<string, string> = {
  applied:     'bg-primary/10 text-primary',
  shortlisted: 'bg-secondary/10 text-secondary',
  rejected:    'bg-error/10 text-error',
};

export default async function CompanyDashboard() {
  const stats = await getMyApplicationStats();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display-sm text-on-background text-2xl font-bold mb-1">Dashboard</h1>
          <p className="font-body-md text-on-surface-variant">Overview of your recruitment activity on AptiLead.</p>
        </div>
        <Link
          href="/company/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Post New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active Postings', value: stats.totalPostings, icon: 'work', color: 'text-primary' },
          { label: 'Total Applications', value: stats.totalApplications, icon: 'inbox', color: 'text-secondary' },
          { label: 'Shortlisted', value: stats.shortlisted, icon: 'star', color: 'text-tertiary' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
              <p className="font-caption text-on-surface-variant text-xs uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={`font-headline-lg text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent applications */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-headline-md text-on-surface font-semibold">Recent Applications</h2>
          <Link href="/company/applications" className="font-caption text-primary hover:underline text-sm">View all</Link>
        </div>
        {stats.recentApplications.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl block mb-2 opacity-40">inbox</span>
            <p className="font-body-md text-sm">No applications yet. Post a job to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {stats.recentApplications.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-metric-label text-on-surface text-sm font-semibold truncate">{a.studentName}</p>
                  <p className="font-caption text-on-surface-variant text-xs truncate">{a.jobTitle}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-metric-label capitalize ${STATUS_STYLE[a.status] ?? 'bg-surface-container text-on-surface'}`}>
                  {a.status}
                </span>
                <p className="font-caption text-on-surface-variant text-xs shrink-0">
                  {new Date(a.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
