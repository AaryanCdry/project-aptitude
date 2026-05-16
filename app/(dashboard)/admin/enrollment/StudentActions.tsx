'use client';

import React, { useState, useTransition } from 'react';
import { resetStudentPassword } from '@/app/actions/enrollment';

export default function StudentActions({
  studentId,
  tempPassword,
}: {
  studentId: string;
  tempPassword: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(tempPassword);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function copy(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const res = await resetStudentPassword(studentId, true);
      if ('error' in res) {
        setError(res.error ?? 'Unknown error');
      } else {
        setCurrentPassword(res.newPassword ?? null);
      }
    });
  }

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container-high"
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-10 z-20 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container">
              <p className="font-metric-label text-on-surface-variant text-xs uppercase tracking-wider">
                Temporary Password
              </p>
            </div>

            <div className="p-4 space-y-3">
              {currentPassword ? (
                <>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm text-on-surface bg-surface border border-outline-variant px-3 py-2 rounded-lg truncate">
                      {currentPassword}
                    </code>
                    <button
                      onClick={() => copy(currentPassword)}
                      className="shrink-0 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Copy password"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {copied ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                  <p className="font-caption text-on-surface-variant text-[11px]">
                    Valid until student changes their password.
                  </p>
                </>
              ) : (
                <p className="font-caption text-on-surface-variant text-sm">
                  Student has already set their own password.
                </p>
              )}

              {error && (
                <p className="font-caption text-error text-xs">{error}</p>
              )}

              <button
                onClick={handleReset}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-2 border border-outline-variant rounded-lg font-metric-label text-sm text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isPending ? 'hourglass_empty' : 'lock_reset'}
                </span>
                {isPending ? 'Resetting…' : 'Reset Password & Send Email'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
