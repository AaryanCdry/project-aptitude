'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateStudentDetails } from '@/app/actions/enrollment';

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

export default function EditStudentModal({
  student,
  departments,
  classes,
  onClose,
}: {
  student: Student;
  departments: Department[];
  classes: ClassRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(student.name ?? '');
  const [regId, setRegId] = useState(student.registration_id ?? '');
  const [deptId, setDeptId] = useState(student.department_id ?? '');
  const [classId, setClassId] = useState(student.class_id ?? '');
  const [section, setSection] = useState(student.section ?? '');
  const [semester, setSemester] = useState(student.semester != null ? String(student.semester) : '');

  const filteredClasses = deptId ? classes.filter(c => c.dept_id === deptId) : classes;
  const { status } = student;

  function handleDeptChange(newDeptId: string) {
    setDeptId(newDeptId);
    const stillValid = classes.find(c => c.id === classId && c.dept_id === newDeptId);
    if (!stillValid) setClassId('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const semNum = semester ? parseInt(semester, 10) : null;
      const res = await updateStudentDetails(student.id, {
        name: name.trim(),
        registration_id: regId.trim() || null,
        department_id: deptId || null,
        class_id: classId || null,
        section: section.trim() || null,
        semester: semNum != null && !isNaN(semNum) ? semNum : null,
      });
      if ('error' in res) {
        setError(res.error ?? 'Unknown error');
      } else {
        setSuccess(true);
        setTimeout(() => { onClose(); router.refresh(); }, 1000);
      }
    });
  }

  const inputCls = 'w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';
  const labelCls = 'block font-metric-label text-on-surface text-[12px] mb-1.5';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden animate-fade-scale pointer-events-auto">

          {/* Header */}
          <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>edit</span>
              <h2 className="font-headline-md text-on-surface font-semibold text-base">Edit Student Details</h2>
            </div>
            <button onClick={onClose} className="p-1.5 text-outline hover:text-on-surface transition-colors rounded-full hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Sub-header: student email (read-only context) */}
          <div className="px-6 py-2.5 bg-surface-container-low/50 border-b border-outline-variant">
            <p className="font-caption text-on-surface-variant text-[12px]">{student.email}</p>
          </div>

          {success ? (
            <div className="px-6 py-14 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
              </div>
              <p className="font-headline-md text-on-surface font-semibold">Changes saved!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
                {error && (
                  <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-base shrink-0">error</span>
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className={labelCls}>Student Name <span className="text-error">*</span></label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="Full name" />
                </div>

                {/* Registration ID */}
                <div>
                  <label className={labelCls}>Registration ID</label>
                  <input type="text" value={regId} onChange={e => setRegId(e.target.value)} className={inputCls} placeholder="e.g. BCA001" />
                </div>

                {/* Department */}
                <div>
                  <label className={labelCls}>Department</label>
                  <select value={deptId} onChange={e => handleDeptChange(e.target.value)} className={inputCls}>
                    <option value="">— No department —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                {/* Class */}
                <div>
                  <label className={labelCls}>Class</label>
                  <select value={classId} onChange={e => setClassId(e.target.value)} className={inputCls}>
                    <option value="">— No class —</option>
                    {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {deptId && filteredClasses.length === 0 && (
                    <p className="font-caption text-on-surface-variant text-[11px] mt-1">No classes in this department yet.</p>
                  )}
                </div>

                {/* Section + Semester */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Section</label>
                    <input type="text" value={section} onChange={e => setSection(e.target.value)} className={inputCls} placeholder="e.g. A" />
                  </div>
                  <div>
                    <label className={labelCls}>Semester</label>
                    <input type="number" value={semester} onChange={e => setSemester(e.target.value)} min={1} max={12} className={inputCls} placeholder="1–12" />
                  </div>
                </div>

                {/* Read-only status + enrolled */}
                <div className="pt-1 pb-1 flex items-center gap-8 border-t border-outline-variant/50">
                  <div className="pt-3">
                    <p className="font-metric-label text-on-surface-variant text-[10px] uppercase tracking-wider mb-1.5">Status</p>
                    {status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary-fixed/60 text-on-secondary-fixed-variant border border-secondary-fixed-dim">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        ACTIVE
                      </span>
                    ) : status === 'INVITED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        INVITED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <div className="pt-3">
                    <p className="font-metric-label text-on-surface-variant text-[10px] uppercase tracking-wider mb-1.5">Enrolled</p>
                    <p className="font-body-md text-on-surface text-[13px]">{student.dateEnrolled}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg font-metric-label text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors border border-outline-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="px-5 py-2 rounded-lg font-metric-label text-sm bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Saving…
                    </>
                  ) : (
                    <>
                      Save Changes
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
