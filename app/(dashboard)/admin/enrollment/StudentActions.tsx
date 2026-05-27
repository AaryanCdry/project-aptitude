'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { resetStudentPassword, removeStudent } from '@/app/actions/enrollment';
import EditStudentModal from './EditStudentModal';

interface Department { id: string; name: string; }
interface ClassRow { id: string; name: string; dept_id: string; }

interface Student {
  id: string;
  name: string | null;
  email: string;
  registration_id: string | null;
  section: string | null;
  semester: number | null;
  temp_password: string | null;
  status: string;
  dateEnrolled: string;
  department_id: string | null;
  class_id: string | null;
}

export default function StudentActions({
  student,
  departments,
  classes,
}: {
  student: Student;
  departments: Department[];
  classes: ClassRow[];
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(student.temp_password);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function copy(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const res = await resetStudentPassword(student.id, true);
      if ('error' in res) {
        setError(res.error ?? 'Unknown error');
      } else {
        setCurrentPassword(res.newPassword ?? null);
      }
    });
  }

  function handleRemove() {
    setError(null);
    startRemoveTransition(async () => {
      const res = await removeStudent(student.id);
      if ('error' in res) {
        setError(res.error ?? 'Unknown error');
        setConfirmRemove(false);
      } else {
        setOpen(false);
      }
    });
  }

  function openEdit() {
    setOpen(false);
    setEditOpen(true);
  }

  return (
    <>
      <div className="relative flex justify-end">
        <button
          onClick={() => { setOpen(!open); setConfirmRemove(false); setError(null); }}
          className="p-2 text-outline hover:text-primary transition-colors rounded-full hover:bg-surface-container-high"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-10 z-20 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl overflow-hidden">

              {/* View Dashboard */}
              <Link
                href={`/admin/students/${student.id}`}
                className="flex items-center gap-2 px-4 py-3 hover:bg-surface-container transition-colors border-b border-outline-variant font-metric-label text-sm text-on-surface"
                onClick={() => setOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px] text-primary">dashboard</span>
                View Dashboard
              </Link>

              {/* Edit Details */}
              <button
                onClick={openEdit}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-surface-container transition-colors border-b border-outline-variant font-metric-label text-sm text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">edit</span>
                Edit Details
              </button>

              {/* Temporary Password section */}
              <div className="px-4 py-3 border-b border-outline-variant bg-surface-container">
                <p className="font-metric-label text-on-surface-variant text-xs uppercase tracking-wider">
                  Temporary Password
                </p>
              </div>
              <div className="p-4 space-y-3 border-b border-outline-variant">
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
                {error && !confirmRemove && (
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

              {/* Remove Student */}
              <div className="p-3">
                {confirmRemove ? (
                  <div className="space-y-2">
                    <p className="font-caption text-on-surface-variant text-[12px] px-1">
                      This will permanently delete the student account. This cannot be undone.
                    </p>
                    {error && (
                      <p className="font-caption text-error text-xs px-1">{error}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setConfirmRemove(false); setError(null); }}
                        className="flex-1 py-1.5 rounded-lg border border-outline-variant font-metric-label text-xs text-on-surface-variant hover:bg-surface-container transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="flex-1 py-1.5 rounded-lg bg-error text-on-error font-metric-label text-xs hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isRemoving ? 'hourglass_empty' : 'delete'}
                        </span>
                        {isRemoving ? 'Removing…' : 'Confirm Remove'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemove(true)}
                    className="w-full flex items-center gap-2 px-1 py-2 rounded-lg font-metric-label text-sm text-error hover:bg-error-container/50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_remove</span>
                    Remove Student
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {editOpen && (
        <EditStudentModal
          student={student}
          departments={departments}
          classes={classes}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
