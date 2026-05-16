'use client';

import { useState, useTransition } from 'react';
import { updateStudentProfile } from '@/app/actions/reports';

export default function ProfileForm({ name, email }: { name: string; email: string }) {
  const [currentName, setCurrentName] = useState(name);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateStudentProfile(currentName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">Full Name</label>
        <input
          type="text"
          value={currentName}
          onChange={e => { setCurrentName(e.target.value); setSaved(false); }}
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        />
      </div>
      <div>
        <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">Email Address</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface-variant font-body-md cursor-not-allowed opacity-70"
        />
        <p className="font-caption text-on-surface-variant mt-1">Email cannot be changed here.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || currentName === name}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isPending ? (
            <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
          ) : (
            <span className="material-symbols-outlined text-sm">save</span>
          )}
          {isPending ? 'Saving…' : 'Save Changes'}
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
