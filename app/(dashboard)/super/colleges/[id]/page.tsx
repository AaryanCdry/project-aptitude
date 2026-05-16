import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollegeWithAdmins } from '@/app/actions/super';
import AddAdminForm from './AddAdminForm';

export default async function CollegeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const college = await getCollegeWithAdmins(id);
  if (!college) notFound();

  const isSuspended = college.status === 'SUSPENDED';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/super/colleges"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display-sm text-on-surface text-2xl font-bold">{college.name}</h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isSuspended ? 'bg-error-container text-on-error-container' : 'bg-secondary-fixed text-on-secondary-fixed-variant'}`}>
              {college.status ?? 'ACTIVE'}
            </span>
          </div>
          <p className="font-caption text-on-surface-variant mt-0.5">Code: <span className="font-mono">{college.code}</span></p>
        </div>
      </div>

      {/* Add Admin */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-headline-md text-on-surface mb-1">Add College Admin</h2>
        <p className="font-caption text-on-surface-variant mb-4">
          Creates a new admin account assigned to this college. The admin can then enroll students and manage cohorts.
        </p>
        <AddAdminForm collegeId={id} />
      </div>

      {/* Admins list */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright">
          <h2 className="font-headline-md text-on-surface">Assigned Admins ({college.admins.length})</h2>
        </div>

        {college.admins.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline block mb-2">manage_accounts</span>
            <p className="font-body-md text-on-surface-variant">No admins assigned yet.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant">
                {['Admin', 'Email', 'Joined', 'Temp Password'].map(h => (
                  <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {college.admins.map((admin: any) => (
                <tr key={admin.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 px-5 font-body-md text-on-surface font-medium">{admin.name}</td>
                  <td className="py-3 px-5 font-caption text-on-surface-variant">{admin.email}</td>
                  <td className="py-3 px-5 font-caption text-on-surface-variant">
                    {new Date(admin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-5">
                    {admin.temp_password ? (
                      <code className="font-mono text-xs bg-surface-container border border-outline-variant px-2 py-1 rounded text-on-surface">
                        {admin.temp_password}
                      </code>
                    ) : (
                      <span className="font-caption text-on-surface-variant text-xs">Password set by user</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
