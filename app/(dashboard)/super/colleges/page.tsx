import React from 'react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSuperAdminData } from '@/app/actions/reports';
import AddCollegeForm from './AddCollegeForm';

async function toggleCollegeStatus(collegeId: string, currentStatus: string) {
  'use server';
  const supabase = await createClient();
  await supabase
    .from('colleges')
    .update({ status: currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' })
    .eq('id', collegeId);
  revalidatePath('/super/colleges');
}

export default async function SuperCollegesPage() {
  const { colleges } = await getSuperAdminData();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">College Management</h1>
        <p className="font-body-md text-on-surface-variant">Add, manage, and suspend colleges on the platform.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-headline-md text-on-surface mb-4">Add New College</h2>
        <AddCollegeForm />
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
          <h2 className="font-headline-md text-on-surface">All Colleges ({colleges.length})</h2>
        </div>
        {colleges.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline block mb-2">business</span>
            <p className="font-body-md text-on-surface-variant">No colleges added yet.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant">
                {['College Name', 'Code', 'Status', 'Added', 'Actions', ''].map(h => (
                  <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {colleges.map((c: any) => {
                const isSuspended = c.status === 'SUSPENDED';
                const toggleAction = toggleCollegeStatus.bind(null, c.id, c.status ?? 'ACTIVE');
                return (
                  <tr key={c.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-3 px-5 font-body-md text-on-surface font-medium">{c.name}</td>
                    <td className="py-3 px-5 font-mono text-sm text-on-surface-variant">{c.code}</td>
                    <td className="py-3 px-5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isSuspended ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed-variant'}`}>
                        {c.status ?? 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-caption text-on-surface-variant">
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-5">
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className={`text-xs font-metric-label hover:underline flex items-center gap-1 ${isSuspended ? 'text-secondary' : 'text-error'}`}
                        >
                          <span className="material-symbols-outlined text-sm">{isSuspended ? 'check_circle' : 'block'}</span>
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      </form>
                    </td>
                    <td className="py-3 px-5">
                      <Link
                        href={`/super/colleges/${c.id}`}
                        className="text-xs font-metric-label text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">manage_accounts</span>
                        Manage
                      </Link>
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
