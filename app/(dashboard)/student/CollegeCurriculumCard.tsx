import React from 'react';
import Link from 'next/link';

interface ClassInfo {
  name: string;
  year?: number | null;
  section?: string | null;
  batch_id?: string | null;
  batches?: { id: string; name: string } | null;
  academic_years?: { name: string } | null;
  departments?: { name: string; course_type?: string | null } | null;
}

export default function CollegeCurriculumCard({
  classInfo,
  hideActions = false,
}: {
  classInfo: ClassInfo | null;
  hideActions?: boolean;
}) {
  if (!classInfo) {
    return (
      <section>
        <h4 className="font-headline-md text-on-surface mb-4">College Curriculum</h4>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm text-center">
          <span className="material-symbols-outlined text-4xl mb-2 block text-outline">school</span>
          <p className="font-body-md text-on-surface-variant">
            You haven&apos;t been assigned to a class yet. Contact your admin.
          </p>
        </div>
      </section>
    );
  }

  const dept = classInfo.departments;
  const batch = classInfo.batches;
  const academicYear = classInfo.academic_years;

  const metaItems = [
    dept && { label: 'Department', value: dept.name, sub: dept.course_type ?? null, icon: 'account_tree' },
    { label: 'Class', value: classInfo.name, sub: classInfo.year ? `Year ${classInfo.year}${classInfo.section ? ` · Section ${classInfo.section}` : ''}` : null, icon: 'meeting_room' },
    batch && { label: 'Batch', value: batch.name, sub: null, icon: 'groups' },
    academicYear && { label: 'Academic Year', value: academicYear.name, sub: null, icon: 'calendar_month' },
  ].filter(Boolean) as { label: string; value: string; sub: string | null; icon: string }[];

  return (
    <section>
      <h4 className="font-headline-md text-on-surface mb-4">College Curriculum</h4>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-fixed text-on-primary-fixed p-3 rounded-xl">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <h5 className="font-headline-md text-on-surface">{dept?.name ?? classInfo.name}</h5>
              {dept?.course_type && (
                <p className="font-caption text-on-surface-variant mt-0.5">{dept.course_type}</p>
              )}
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-caption border shrink-0 bg-secondary-fixed text-on-secondary-fixed-variant border-secondary-fixed-dim">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            Enrolled
          </span>
        </div>

        {metaItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {metaItems.map((item) => (
              <div key={item.label} className="bg-surface-container rounded-lg p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant mt-0.5 shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="font-caption text-on-surface-variant mb-1">{item.label}</p>
                  <p className="font-metric-label text-on-surface truncate">{item.value}</p>
                  {item.sub && (
                    <p className="font-caption text-on-surface-variant text-xs mt-0.5">{item.sub}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="font-caption text-on-surface-variant">
            {hideActions
              ? 'This student is tracked through this curriculum.'
              : 'Your college tracks your progress through this curriculum. Take tests to advance.'}
          </p>
          {!hideActions && (
            <Link
              href="/assessment"
              className="flex items-center gap-1 text-primary font-metric-label text-sm hover:underline shrink-0"
            >
              Start Test <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
