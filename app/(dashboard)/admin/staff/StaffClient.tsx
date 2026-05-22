'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createHOD, createMentor, setMentorClasses, removeStaff } from '@/app/actions/staff';

interface StaffData {
  hods: Array<{ id: string; name: string; email: string; departmentName: string | null; temp_password: string | null }>;
  mentors: Array<{ id: string; name: string; email: string; temp_password: string | null; classes: Array<{ id: string; name: string; dept_id: string }> }>;
  departments: Array<{ id: string; name: string; course_type: string | null }>;
  classes: Array<{ id: string; name: string; year: number | null; section: string | null; dept_id: string; departments?: any }>;
}

export default function StaffClient({ initialData, role }: { initialData: StaffData; role: string | null }) {
  const router = useRouter();
  // Only a Principal (ADMIN) can create HODs; a HOD (SUB_ADMIN) cannot.
  const canCreateHOD = role === 'ADMIN';
  const [tab, setTab] = useState<'hods' | 'mentors'>('hods');
  const [showHODModal, setShowHODModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState<string | null>(null);
  const [editClassIds, setEditClassIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const handleCreateHOD = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createHOD(fd);
      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
      } else {
        setFlash({ kind: 'ok', text: `HOD created. Temp password: ${(res as any).tempPassword}` });
        setShowHODModal(false);
        router.refresh();
      }
    });
  };

  const handleCreateMentor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const checked = Array.from(e.currentTarget.querySelectorAll('input[name="class_id_check"]:checked')) as HTMLInputElement[];
    fd.set('class_ids', checked.map(c => c.value).join(','));
    startTransition(async () => {
      const res = await createMentor(fd);
      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
      } else {
        setFlash({ kind: 'ok', text: `Mentor created. Temp password: ${(res as any).tempPassword}` });
        setShowMentorModal(false);
        router.refresh();
      }
    });
  };

  const handleSaveClasses = async (mentorId: string) => {
    startTransition(async () => {
      const res = await setMentorClasses(mentorId, [...editClassIds]);
      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
      } else {
        setFlash({ kind: 'ok', text: 'Classes updated.' });
        setEditingMentor(null);
        router.refresh();
      }
    });
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this staff member? They will become a regular student.')) return;
    startTransition(async () => {
      const res = await removeStaff(userId);
      if ('error' in res && res.error) {
        setFlash({ kind: 'err', text: res.error });
      } else {
        router.refresh();
      }
    });
  };

  const toggleEditClass = (classId: string) => {
    const next = new Set(editClassIds);
    if (next.has(classId)) next.delete(classId);
    else next.add(classId);
    setEditClassIds(next);
  };

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-headline-md text-2xl text-on-surface">Staff</h1>
          <p className="font-body-md text-on-surface-variant mt-1">Manage HODs and Mentors for your college.</p>
        </div>
        <div className="flex gap-2">
          {canCreateHOD && (
            <button
              onClick={() => setShowHODModal(true)}
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-metric-label hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Add HOD
            </button>
          )}
          <button
            onClick={() => setShowMentorModal(true)}
            className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface font-metric-label hover:bg-surface-container-high transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">school</span>
            Add Mentor
          </button>
        </div>
      </div>

      {flash && (
        <div className={`mb-4 px-4 py-3 rounded-lg ${flash.kind === 'ok' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-error-container text-on-error-container'}`}>
          {flash.text}
        </div>
      )}

      <div className="flex gap-2 mb-4 border-b border-outline-variant">
        <button
          onClick={() => setTab('hods')}
          className={`px-4 py-2 font-metric-label text-sm border-b-2 transition-colors ${tab === 'hods' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
        >
          HODs ({initialData.hods.length})
        </button>
        <button
          onClick={() => setTab('mentors')}
          className={`px-4 py-2 font-metric-label text-sm border-b-2 transition-colors ${tab === 'mentors' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
        >
          Mentors ({initialData.mentors.length})
        </button>
      </div>

      {tab === 'hods' && (
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          {initialData.hods.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">No HODs yet. Click "Add HOD" to create one.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-container-high">
                <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Temp Password</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {initialData.hods.map(h => (
                  <tr key={h.id} className="border-t border-outline-variant">
                    <td className="px-5 py-3 font-body-md text-on-surface">{h.name}</td>
                    <td className="px-5 py-3 font-body-md text-on-surface-variant">{h.email}</td>
                    <td className="px-5 py-3 font-body-md text-on-surface">{h.departmentName ?? '—'}</td>
                    <td className="px-5 py-3 font-caption text-on-surface-variant">{h.temp_password ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleRemove(h.id)}
                        disabled={pending}
                        className="text-error hover:underline text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'mentors' && (
        <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
          {initialData.mentors.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">No mentors yet. Click "Add Mentor" to create one.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-container-high">
                <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Classes</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {initialData.mentors.map(m => (
                  <tr key={m.id} className="border-t border-outline-variant align-top">
                    <td className="px-5 py-3 font-body-md text-on-surface">{m.name}</td>
                    <td className="px-5 py-3 font-body-md text-on-surface-variant">{m.email}</td>
                    <td className="px-5 py-3">
                      {editingMentor === m.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                            {initialData.classes.map(c => (
                              <label key={c.id} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={editClassIds.has(c.id)}
                                  onChange={() => toggleEditClass(c.id)}
                                />
                                {c.name}
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveClasses(m.id)}
                              disabled={pending}
                              className="px-3 py-1 rounded bg-primary text-on-primary text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingMentor(null)}
                              className="px-3 py-1 rounded border border-outline-variant text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.classes.length === 0 ? (
                            <span className="text-on-surface-variant text-sm">No classes assigned</span>
                          ) : (
                            m.classes.map(c => (
                              <span key={c.id} className="inline-block px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-xs">
                                {c.name}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right space-x-3">
                      <button
                        onClick={() => {
                          setEditingMentor(m.id);
                          setEditClassIds(new Set(m.classes.map(c => c.id)));
                        }}
                        className="text-primary hover:underline text-sm"
                      >
                        Edit classes
                      </button>
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={pending}
                        className="text-error hover:underline text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* HOD modal */}
      {showHODModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateHOD} className="bg-surface-container rounded-2xl border border-outline-variant shadow-xl max-w-md w-full p-6">
            <h2 className="font-headline-md text-lg text-on-surface mb-4">Add HOD</h2>
            <div className="space-y-3">
              <input
                name="name"
                required
                placeholder="Full name"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
              />
              <input
                name="email"
                required
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
              />
              <select
                name="department_id"
                required
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
              >
                <option value="">Select department</option>
                {initialData.departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowHODModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-50">
                {pending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mentor modal */}
      {showMentorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateMentor} className="bg-surface-container rounded-2xl border border-outline-variant shadow-xl max-w-lg w-full p-6">
            <h2 className="font-headline-md text-lg text-on-surface mb-4">Add Mentor</h2>
            <div className="space-y-3">
              <input
                name="name"
                required
                placeholder="Full name"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
              />
              <input
                name="email"
                required
                type="email"
                placeholder="Email"
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest"
              />
              <div>
                <p className="font-metric-label text-on-surface-variant text-xs uppercase tracking-wider mb-2">Assign classes (optional)</p>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto p-2 rounded-lg border border-outline-variant">
                  {initialData.classes.length === 0 ? (
                    <span className="text-on-surface-variant text-sm">No classes available</span>
                  ) : (
                    initialData.classes.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="class_id_check" value={c.id} />
                        {c.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setShowMentorModal(false)} className="flex-1 px-4 py-2 rounded-lg border border-outline-variant">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary disabled:opacity-50">
                {pending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
