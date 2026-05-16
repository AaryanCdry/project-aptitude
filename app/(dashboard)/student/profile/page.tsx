import React from 'react';
import { getStudentProfile } from '@/app/actions/reports';
import ProfileForm from './ProfileForm';

export default async function StudentProfilePage() {
  const profile = await getStudentProfile();

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

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
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-primary-fixed-dim text-on-primary-fixed text-xs font-bold px-2.5 py-1 rounded-full">{profile?.role}</span>
            <span className="font-caption text-on-surface-variant">Joined {joinedDate}</span>
          </div>
        </div>
      </div>

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
