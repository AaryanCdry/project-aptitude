'use client';

import { useState, useTransition } from 'react';
import { updateAdminSettings } from '@/app/actions/reports';

export default function AdminSettingsForm({ name, email }: { name: string; email: string }) {
  const [currentName, setCurrentName] = useState(name);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateAdminSettings(currentName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">Full Name</label>
          <input
            type="text"
            value={currentName}
            onChange={e => { setCurrentName(e.target.value); setSaved(false); }}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface-variant font-body-md opacity-70 cursor-not-allowed"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || currentName === name}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isPending
            ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            : <span className="material-symbols-outlined text-sm">save</span>}
          {isPending ? 'Saving…' : 'Save'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 font-caption text-secondary">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
