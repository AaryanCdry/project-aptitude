import React from 'react';
import { createClient } from '@/lib/supabase/server';

async function getSubAdminClasses() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, year, section, created_at, departments(name)')
    .order('created_at', { ascending: false });
  return classes ?? [];
}

export default async function SubAdminClassesPage() {
  const classes = await getSubAdminClasses();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Class Management</h1>
        <p className="font-body-md text-on-surface-variant">View classes within your department.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
          <h2 className="font-headline-md text-on-surface">Department Classes</h2>
          <span className="font-caption text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline-variant">
            {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </span>
        </div>
        {classes.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline block mb-2">meeting_room</span>
            <p className="font-body-md text-on-surface-variant">No classes found. Ask your College Admin to create classes.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant">
                {['Class Name', 'Department', 'Year', 'Section', 'Created'].map(h => (
                  <th key={h} className="py-3 px-5 font-metric-label text-on-surface-variant text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {classes.map((cls: any) => (
                <tr key={cls.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-3 px-5 font-body-md text-on-surface font-medium">{cls.name ?? `${cls.year}-${cls.section}`}</td>
                  <td className="py-3 px-5 font-body-md text-on-surface-variant">{cls.departments?.name ?? '—'}</td>
                  <td className="py-3 px-5 font-body-md text-on-surface">{cls.year ?? '—'}</td>
                  <td className="py-3 px-5 font-body-md text-on-surface">{cls.section ?? '—'}</td>
                  <td className="py-3 px-5 font-caption text-on-surface-variant">
                    {new Date(cls.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
