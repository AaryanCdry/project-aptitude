import React from 'react';
import { getAdminSettings } from '@/app/actions/reports';
import AdminSettingsForm from './AdminSettingsForm';

export default async function AdminSettingsPage() {
  const admin = await getAdminSettings();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Settings</h1>
        <p className="font-body-md text-on-surface-variant">Manage your admin account and college preferences.</p>
      </div>

      {/* Admin profile */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-headline-md text-on-surface mb-6">Admin Profile</h2>
        <div className="flex items-center gap-5 mb-6">
          <div className="size-16 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-on-primary font-display-sm text-xl font-bold uppercase">
              {admin?.name?.[0] ?? admin?.email?.[0] ?? 'A'}
            </span>
          </div>
          <div>
            <p className="font-headline-md text-on-surface font-bold">{admin?.name ?? '—'}</p>
            <p className="font-body-md text-on-surface-variant">{admin?.email}</p>
            <span className="bg-tertiary-fixed/40 text-on-tertiary-fixed-variant text-xs font-bold px-2.5 py-1 rounded-full mt-1 inline-block">{admin?.role}</span>
          </div>
        </div>
        <AdminSettingsForm name={admin?.name ?? ''} email={admin?.email ?? ''} />
      </div>

      {/* College profile (placeholder — needs colleges table integration) */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-headline-md text-on-surface mb-4">College Profile</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">College Name</label>
            <input
              type="text"
              placeholder="Your college name"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">College Code</label>
            <input
              type="text"
              placeholder="e.g. ABC-001"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="font-caption text-on-surface-variant">College profile editing requires Super Admin approval.</p>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h2 className="font-headline-md text-on-surface mb-4">Notification Preferences</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: 'New student enrollment', desc: 'Get notified when a new student joins', defaultOn: true },
            { label: 'Test completion alerts', desc: 'Receive alerts when tests are completed', defaultOn: false },
            { label: 'At-risk student flags', desc: 'Alert when a student scores below 50%', defaultOn: true },
          ].map(({ label, desc, defaultOn }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-outline-variant last:border-0">
              <div>
                <p className="font-metric-label text-on-surface">{label}</p>
                <p className="font-caption text-on-surface-variant">{desc}</p>
              </div>
              <ToggleSwitch defaultOn={defaultOn} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ defaultOn }: { defaultOn: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
      <div className="w-10 h-6 bg-surface-container-high peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
    </label>
  );
}
