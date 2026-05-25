'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { enrollStudent } from '@/app/actions/enrollment';

interface Cohort { id: string; name: string; }
interface Department { id: string; name: string; }
interface ClassRow { id: string; name: string; dept_id: string; section?: string | null; }

type Result =
  | { success: true; tempPassword: string; studentId: string; emailSent?: boolean; emailError?: string }
  | { error: string };

export default function ManualEnrollmentForm({
  cohorts,
  preselectedCohortId,
  departments = [],
  classes = [],
}: {
  cohorts: Cohort[];
  preselectedCohortId?: string | null;
  departments?: Department[];
  classes?: ClassRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [sendInvite, setSendInvite] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const filteredClasses = selectedDeptId
    ? classes.filter(c => c.dept_id === selectedDeptId)
    : classes;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await enrollStudent(fd);
      setResult(res as Result);
    });
  }

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (result && 'success' in result) {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-secondary">how_to_reg</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface text-xl">Student Enrolled!</h2>
              <p className="font-body-md text-on-surface-variant mt-1">
                The account has been created. Share these credentials with the student.
              </p>
            </div>

            <div className="w-full bg-surface-container border border-outline-variant rounded-xl p-5 text-left">
              <p className="font-metric-label text-on-surface-variant text-xs uppercase tracking-wider mb-2">
                Temporary Password
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-lg text-on-surface bg-surface px-3 py-2 rounded-lg border border-outline-variant">
                  {result.tempPassword}
                </code>
                <button
                  onClick={() => copyPassword(result.tempPassword)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-metric-label text-sm rounded-lg hover:bg-primary/90 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="font-caption text-on-surface-variant mt-2 text-xs">
                The student uses this to log in for the first time, then sets their own password.
              </p>
            </div>

            {sendInvite && (
              <div className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left ${result.emailError ? 'bg-error-container/30 border-error/20' : 'bg-secondary-fixed/20 border-secondary-fixed-dim'}`}>
                <span className={`material-symbols-outlined text-sm mt-0.5 ${result.emailError ? 'text-error' : 'text-secondary'}`}>
                  {result.emailError ? 'mail_off' : 'mark_email_read'}
                </span>
                <div>
                  <p className={`font-metric-label text-sm ${result.emailError ? 'text-on-error-container' : 'text-on-surface'}`}>
                    {result.emailError ? 'Invitation email failed to send' : 'Invitation email sent'}
                  </p>
                  {result.emailError && (
                    <p className="font-caption text-on-error-container text-xs mt-0.5">{result.emailError}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 w-full pt-2">
              <button
                onClick={() => { setResult(null); setCopied(false); setSelectedDeptId(''); }}
                className="flex-1 py-3 border border-outline-variant rounded-lg font-metric-label text-on-surface hover:bg-surface-container transition-colors"
              >
                Enroll Another
              </button>
              <button
                onClick={() => router.push('/admin/enrollment')}
                className="flex-1 py-3 bg-primary text-on-primary rounded-lg font-metric-label hover:bg-primary/90 transition-colors"
              >
                Go to Enrollment List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[640px] mx-auto">
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

            {result && 'error' in result && (
              <div className="bg-error-container border border-error/20 rounded-lg p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-error mt-0.5">error</span>
                <p className="font-body-md text-on-error-container">{result.error}</p>
              </div>
            )}

            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label className="font-metric-label text-on-surface" htmlFor="name">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                <input id="name" name="name" required type="text" placeholder="e.g. Jane Doe"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="font-metric-label text-on-surface" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input id="email" name="email" required type="email" placeholder="jane.doe@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            {/* Registration ID */}
            <div className="flex flex-col gap-2">
              <label className="font-metric-label text-on-surface" htmlFor="registration_id">
                Registration ID
                <span className="font-body-md text-on-surface-variant ml-1">(college roll / enrolment number)</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">badge</span>
                <input id="registration_id" name="registration_id" type="text" placeholder="e.g. 21CS001"
                  className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            {/* Department + Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-metric-label text-on-surface" htmlFor="department_id">Department</label>
                <div className="relative">
                  <select
                    id="department_id" name="department_id"
                    value={selectedDeptId}
                    onChange={e => setSelectedDeptId(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none"
                  >
                    <option value="">No department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-metric-label text-on-surface" htmlFor="class_id">Class</label>
                <div className="relative">
                  <select
                    id="class_id" name="class_id"
                    disabled={filteredClasses.length === 0}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none disabled:opacity-50"
                  >
                    <option value="">No class</option>
                    {filteredClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.section ? ` — ${c.section}` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
                {selectedDeptId && filteredClasses.length === 0 && (
                  <p className="font-caption text-on-surface-variant text-xs">No classes found for this department.</p>
                )}
              </div>
            </div>

            {/* Section + Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-metric-label text-on-surface" htmlFor="section">
                  Section
                  <span className="font-body-md text-on-surface-variant ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">group</span>
                  <input id="section" name="section" type="text" placeholder="e.g. A, B, Morning"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-metric-label text-on-surface" htmlFor="semester">
                  Current Semester
                  <span className="font-body-md text-on-surface-variant ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">school</span>
                  <input id="semester" name="semester" type="number" min={1} max={12} placeholder="e.g. 3"
                    className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
                </div>
              </div>
            </div>

            {/* Cohort + Date row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-metric-label text-on-surface" htmlFor="cohortId">Cohort (optional)</label>
                <div className="relative">
                  <select id="cohortId" name="cohortId"
                    defaultValue={preselectedCohortId ?? ''}
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
                <label className="font-metric-label text-on-surface" htmlFor="startDate">Start Date</label>
                <input id="startDate" name="startDate" type="date"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
              </div>
            </div>

            {/* Send Invite toggle */}
            <div className="pt-6 border-t border-outline-variant flex items-center justify-between">
              <div>
                <p className="font-body-lg text-on-surface font-medium">Send Invitation Email</p>
                <p className="font-body-md text-on-surface-variant mt-1">
                  Email the student a password-setup link via Resend.
                </p>
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
            <input type="hidden" name="sendInvite" value={sendInvite ? 'true' : 'false'} />
          </div>

          <footer className="px-8 py-6 bg-surface-container flex justify-end gap-4 items-center border-t border-outline-variant">
            <Link href="/admin/enrollment" className="px-6 py-3 rounded-lg font-metric-label text-on-surface border border-outline hover:bg-surface-variant transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
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
