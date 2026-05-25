import Link from 'next/link';
import { getCallerScope } from '../actions/scope';

export default async function ScheduleTestLayout({ children }: { children: React.ReactNode }) {
  const scope = await getCallerScope();
  const backHref =
    scope.role === 'MENTOR' ? '/mentor'
    : scope.role === 'STUDENT' ? '/student'
    : '/admin';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface-container-lowest border-b border-outline-variant px-6 py-3 flex items-center justify-between">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-on-surface hover:text-primary font-metric-label text-sm transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to dashboard
        </Link>
        <div className="font-headline-md text-on-surface text-base">Schedule Test</div>
        <div className="w-32" />
      </header>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
