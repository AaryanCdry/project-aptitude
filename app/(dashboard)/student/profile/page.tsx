import React from 'react';
import { getStudentProfile } from '@/app/actions/reports';
import ProfileForm from './ProfileForm';

export default async function StudentProfilePage() {
  const profile = await getStudentProfile();

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  const cls = (profile as any)?.classes ?? null;
  const dept = cls?.departments ?? null;
  const batch = cls?.batches ?? null;
  const academicYear = cls?.academic_years ?? null;

  const academicItems = [
    dept && { label: 'Department', value: dept.name, sub: dept.course_type ?? null, icon: 'account_tree' },
    cls && { label: 'Class', value: cls.name, sub: cls.year ? `Year ${cls.year}${cls.section ? ` · Section ${cls.section}` : ''}` : null, icon: 'meeting_room' },
    batch && { label: 'Batch', value: batch.name, sub: null, icon: 'groups' },
    academicYear && { label: 'Academic Year', value: academicYear.name, sub: null, icon: 'calendar_month' },
  ].filter(Boolean) as { label: string; value: string; sub: string | null; icon: string }[];

  return (
    <div className="p-margin-desktop max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface mb-2">Profile</h1>
        <p className="font-body-md text-on-surface-variant">Manage your personal information and account settings.</p>
      </div>

      {/* Avatar + info */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6 flex items-center gap-6">
        <div className="size-20 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-on-primary font-display-sm text-2xl font-bold uppercase">
            {profile?.name?.[0] ?? profile?.email?.[0] ?? 'S'}
          </span>
        </div>
        <div>
          <h2 className="font-headline-md text-on-surface text-xl font-bold">{profile?.name ?? 'Student'}</h2>
          <p className="font-body-md text-on-surface-variant">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="bg-primary-fixed-dim text-on-primary-fixed text-xs font-bold px-2.5 py-1 rounded-full">{profile?.role}</span>
            <span className="font-caption text-on-surface-variant">Joined {joinedDate}</span>
          </div>
        </div>
      </div>

      {/* Academic context */}
      {academicItems.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-headline-md text-on-surface mb-4">Academic Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {academicItems.map(item => (
              <div key={item.label} className="bg-surface-container rounded-lg p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant mt-0.5 shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <p className="font-caption text-on-surface-variant mb-1">{item.label}</p>
                  <p className="font-metric-label text-on-surface truncate">{item.value}</p>
                  {item.sub && <p className="font-caption text-on-surface-variant text-xs mt-0.5">{item.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
        <h3 className="font-headline-md text-on-surface mb-6">Personal Information</h3>
        <ProfileForm name={profile?.name ?? ''} email={profile?.email ?? ''} />
      </div>

      {/* Password section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h3 className="font-headline-md text-on-surface mb-2">Password</h3>
        <p className="font-body-md text-on-surface-variant mb-4">
          Password changes are sent via email. Click below to receive a reset link.
        </p>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-outline text-on-surface rounded-lg font-metric-label hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-sm">lock_reset</span>
          Send Password Reset Email
        </button>
      </div>
    </div>
  );
}
