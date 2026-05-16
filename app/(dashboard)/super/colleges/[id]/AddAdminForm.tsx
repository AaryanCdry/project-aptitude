'use client';

import { useState, useTransition } from 'react';
import { createCollegeAdmin } from '@/app/actions/super';

export default function AddAdminForm({ collegeId }: { collegeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: true; tempPassword?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCollegeAdmin(fd);
      setResult(res);
      if ('success' in res) {
        setName('');
        setEmail('');
      }
    });
  }

  function copy(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="collegeId" value={collegeId} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">Full Name</label>
            <input
              name="name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dr. Jane Smith"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@college.edu"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            {isPending ? 'Creating…' : 'Create Admin Account'}
          </button>
          {result && 'error' in result && (
            <p className="font-caption text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {result.error}
            </p>
          )}
        </div>
      </form>

      {result && 'success' in result && result.tempPassword && (
        <div className="bg-secondary-fixed/20 border border-secondary-fixed-dim rounded-xl p-4 flex flex-col gap-2">
          <p className="font-metric-label text-on-surface text-sm flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-secondary">check_circle</span>
            Admin account created. Share this temporary password:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm bg-surface border border-outline-variant px-3 py-2 rounded-lg text-on-surface">
              {result.tempPassword}
            </code>
            <button
              onClick={() => copy(result.tempPassword!)}
              className="shrink-0 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Copy"
            >
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
            </button>
          </div>
          <p className="font-caption text-on-surface-variant text-xs">
            The admin logs in with this password and should change it immediately.
          </p>
        </div>
      )}
    </div>
  );
}
