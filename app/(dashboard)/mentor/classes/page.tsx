import Link from 'next/link';
import { getMentorClasses } from '@/app/actions/mentor';

export default async function MentorClassesPage() {
  const classes = await getMentorClasses();

  return (
    <div className="p-8 max-w-container-max-width mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">My Classes</h1>
        <p className="font-body-md text-on-surface-variant">
          Classes you mentor. Open one to see the roster and track student performance.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3 block">meeting_room</span>
          <h2 className="font-headline-md text-on-surface text-lg mb-1">No classes assigned yet</h2>
          <p className="font-body-md text-on-surface-variant">
            Ask your Principal or HOD to assign you to a class on the Staff page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/mentor/students?classId=${c.id}`}
              className="group bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:border-primary hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-all flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="bg-primary-fixed text-on-primary-fixed p-3 rounded-xl">
                  <span className="material-symbols-outlined">meeting_room</span>
                </div>
                <span className="text-xs font-metric-label bg-surface-container px-2 py-1 rounded-full text-on-surface-variant">
                  {c.courseType ?? '—'}
                </span>
              </div>
              <div>
                <h3 className="font-headline-md text-on-surface text-lg group-hover:text-primary transition-colors">{c.name}</h3>
                <p className="font-caption text-on-surface-variant mt-0.5">
                  {c.departmentName ?? 'No department'}
                  {c.year ? ` · Year ${c.year}` : ''}
                  {c.section ? ` · Section ${c.section}` : ''}
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-metric-label text-on-surface text-sm">
                  <span className="material-symbols-outlined text-base">group</span>
                  {c.studentCount} student{c.studentCount === 1 ? '' : 's'}
                </span>
                <span className="text-primary text-sm font-metric-label inline-flex items-center gap-1">
                  View roster
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
