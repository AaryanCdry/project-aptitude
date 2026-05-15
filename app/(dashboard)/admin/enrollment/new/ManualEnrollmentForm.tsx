'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { enrollStudent } from '@/app/actions/enrollment';

interface Cohort { id: string; name: string; }

export default function ManualEnrollmentForm({ cohorts }: { cohorts: Cohort[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; tempPassword?: string } | null>(null);
  const [sendInvite, setSendInvite] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await enrollStudent(fd);
      setResult(res as any);
      if ((res as any).success) {
        setTimeout(() => router.push('/admin/enrollment'), 2000);
      }
    });
  }

  return (
    <div className="max-w-[640px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/enrollment" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="font-display-sm text-display-sm text-on-surface">Manual Enrollment</h1>
          <p className="font-body-md text-on-surface-variant mt-0.5">Add a new student to an upcoming assessment cohort.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-8 flex flex-col gap-6">

            {/* Success / Error banner */}
            {result?.success && (
              <div className="bg-secondary-fixed/20 border border-secondary-fixed-dim rounded-lg p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary mt-0.5">check_circle</span>
                <div>
                  <p className="font-metric-label text-on-surface">Student enrolled successfully!</p>
                  {result.tempPassword && (
                    <p className="font-caption text-on-surface-variant mt-1">Temp password: <code className="font-mono bg-surface-container px-1.5 py-0.5 rounded text-on-surface">{result.tempPassword}</code></p>
                  )}
                  <p className="font-caption text-on-surface-variant">Redirecting to enrollment list…</p>
                </div>
              </div>
            )}
            {result?.error && (
              <div className="bg-error-container border border-error/20 rounded-lg p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-error mt-0.5">error</span>
                <p className="font-body-md text-on-error-container">{result.error}</p>
              </div>
            )}

            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label className="font-metric-label text-metric-label text-on-surface" htmlFor="name">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                <input id="name" name="name" required type="text" placeholder="e.g. Jane Doe"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="font-metric-label text-metric-label text-on-surface" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input id="email" name="email" required type="email" placeholder="jane.doe@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            {/* Cohort + Date row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-metric-label text-metric-label text-on-surface" htmlFor="cohortId">Cohort (optional)</label>
                <div className="relative">
                  <select id="cohortId" name="cohortId"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none">
                    <option value="">No cohort</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-metric-label text-metric-label text-on-surface" htmlFor="startDate">Start Date</label>
                <input id="startDate" name="startDate" type="date"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            {/* Send Invite toggle */}
            <div className="pt-6 border-t border-outline-variant flex items-center justify-between">
              <div>
                <p className="font-body-lg text-on-surface font-medium">Send Invitation</p>
                <p className="font-body-md text-on-surface-variant mt-1">Automatically email the student with onboarding instructions.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={sendInvite}
                onClick={() => setSendInvite(!sendInvite)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${sendInvite ? 'bg-primary' : 'bg-surface-variant'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${sendInvite ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className="px-8 py-6 bg-surface-container flex justify-end gap-4 items-center border-t border-outline-variant">
            <Link href="/admin/enrollment" className="px-6 py-3 rounded-lg font-metric-label text-on-surface border border-outline hover:bg-surface-variant transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending || result?.success === true}
              className="px-6 py-3 rounded-lg font-metric-label bg-primary text-on-primary hover:bg-on-primary-fixed-variant shadow-sm transition-all disabled:opacity-60 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPending ? 'hourglass_empty' : 'person_add'}
              </span>
              {isPending ? 'Enrolling…' : 'Enroll Student'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
