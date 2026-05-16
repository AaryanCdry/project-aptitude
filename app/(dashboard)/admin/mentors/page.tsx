import React from 'react';
import { getMentorList, removeMentor } from '@/app/actions/reports';
import { revalidatePath } from 'next/cache';
import AddMentorForm from './AddMentorForm';

async function removeMentorAction(mentorId: string) {
  'use server';
  await removeMentor(mentorId);
  revalidatePath('/admin/mentors');
}

export default async function AdminMentorsPage() {
  const mentors = await getMentorList();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Mentor Management</h1>
          <p className="font-body-md text-on-surface-variant">Add and manage mentors for your college.</p>
        </div>
        <span className="bg-surface-container text-on-surface-variant font-caption px-3 py-1.5 rounded-full border border-outline-variant">
          {mentors.length} mentor{mentors.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-headline-md text-on-surface mb-4">Invite Mentor</h2>
        <AddMentorForm />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright">
          <h2 className="font-headline-md text-on-surface">Current Mentors</h2>
        </div>
        {mentors.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline block mb-2">group</span>
            <p className="font-body-md text-on-surface-variant">No mentors added yet. Invite one above.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant">
                {['Mentor', 'Email', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {mentors.map((m: any) => {
                const joined = new Date(m.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                });
                const initials = m.name
                  ? m.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : m.email[0].toUpperCase();
                const removeWithId = removeMentorAction.bind(null, m.id);
                return (
                  <tr key={m.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-secondary-fixed flex items-center justify-center shrink-0">
                          <span className="font-metric-label text-on-secondary-fixed text-sm">{initials}</span>
                        </div>
                        <span className="font-body-md text-on-surface">{m.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-body-md text-on-surface-variant">{m.email}</td>
                    <td className="py-3 px-5 font-caption text-on-surface-variant">{joined}</td>
                    <td className="py-3 px-5">
                      <form action={removeWithId}>
                        <button
                          type="submit"
                          className="text-error text-xs font-metric-label hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">person_remove</span>
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
