import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCohortById, getCohortAssessments } from '@/app/actions/cohorts';
import ScheduleAssessmentModal from './ScheduleAssessmentModal';
import DeleteAssessmentButton from './DeleteAssessmentButton';
import SyncFromClassButton from './SyncFromClassButton';

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: 'bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim',
  SCHEDULED: 'bg-surface-container text-on-surface-variant border border-outline-variant',
  COMPLETED: 'bg-surface-container-high text-on-surface border border-outline-variant',
};

export default async function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cohort, assessments] = await Promise.all([
    getCohortById(id),
    getCohortAssessments(id),
  ]);
  if (!cohort) notFound();

  const { name, description, status, start_date, end_date, admin, members, studentCount, avgPercentile, completionRate, class: linkedClass, dept: linkedDept } = cohort as any;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="max-w-container-max-width mx-auto pb-24">
      {/* Breadcrumb + Header */}
      <div className="flex items-center gap-2 mb-6 font-caption text-on-surface-variant">
        <Link href="/admin/cohorts" className="hover:text-primary transition-colors">Cohorts</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-on-surface font-semibold">{name}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display-sm text-display-sm text-on-background">{name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-metric-label text-[11px] uppercase ${STATUS_CHIP[status] ?? ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-secondary' : 'bg-outline'}`} />
              {status}
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant">{description}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href={`/admin/enrollment/new?cohort=${id}`} className="px-5 py-2.5 bg-surface text-primary border border-outline-variant rounded-lg font-metric-label hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined">person_add</span>
            Add Student
          </Link>
          <Link href="/admin/enrollment/bulk" className="px-5 py-2.5 bg-surface text-primary border border-outline-variant rounded-lg font-metric-label hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined">upload_file</span>
            Bulk Upload
          </Link>
          <ScheduleAssessmentModal cohortId={id} />
        </div>
      </div>

      {/* KPI Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Students', value: studentCount, icon: 'group', color: 'text-primary' },
          { label: 'Avg Score', value: `${avgPercentile}%`, icon: 'analytics', color: 'text-secondary' },
          { label: 'Completion', value: `${completionRate}%`, icon: 'task_alt', color: 'text-primary' },
          { label: 'Duration', value: start_date ? `${formatDate(start_date)} – ${formatDate(end_date)}` : 'TBD', icon: 'calendar_month', color: 'text-on-surface-variant', small: true },
        ].map(({ label, value, icon, color, small }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-[0px_4px_10px_-2px_rgba(79,70,229,0.05)] transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined text-xl ${color}`} style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              <p className="font-metric-label text-on-surface-variant uppercase text-[10px]">{label}</p>
            </div>
            <p className={`font-display-sm text-on-surface ${small ? 'text-[14px] leading-snug' : 'text-[28px]'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sync from class/dept */}
      <SyncFromClassButton
        cohortId={id}
        linkedClassName={linkedClass?.name ?? null}
        linkedDeptName={!linkedClass && linkedDept ? linkedDept.name : null}
      />

      {/* Instructor + Dates info row */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold">
            {(admin as any)?.name?.[0] ?? 'A'}
          </div>
          <div>
            <p className="font-caption text-on-surface-variant">Lead Instructor</p>
            <p className="font-body-md font-semibold text-on-surface">{(admin as any)?.name ?? (admin as any)?.email ?? 'Unassigned'}</p>
          </div>
        </div>
        <div className="sm:ml-auto flex gap-8">
          <div>
            <p className="font-caption text-on-surface-variant">Start Date</p>
            <p className="font-body-md font-semibold text-on-surface">{formatDate(start_date)}</p>
          </div>
          <div>
            <p className="font-caption text-on-surface-variant">End Date</p>
            <p className="font-body-md font-semibold text-on-surface">{formatDate(end_date)}</p>
          </div>
        </div>
      </div>

      {/* Completion progress */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <p className="font-metric-label text-on-surface">Cohort Completion Rate</p>
          <span className="font-body-md text-on-surface font-bold">{completionRate}%</span>
        </div>
        <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
        </div>
        <p className="font-caption text-on-surface-variant mt-2">
          {members.filter((m: any) => m.testsCompleted > 0).length} of {studentCount} students have completed at least one assessment.
        </p>
      </div>

      {/* Scheduled Assessments */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h2 className="font-headline-md text-on-surface">Scheduled Assessments</h2>
            <p className="font-caption text-on-surface-variant mt-0.5">Tasks assigned to all students in this cohort.</p>
          </div>
          <span className="font-caption text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
            {assessments.length} scheduled
          </span>
        </div>

        {assessments.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-outline block mb-2">assignment</span>
            <p className="font-body-md text-on-surface-variant">No assessments scheduled yet.</p>
            <p className="font-caption text-on-surface-variant mt-1">Use "Schedule Assessment" above to assign a test to this cohort.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {(assessments as any[]).map((a: any) => {
              const due = a.due_date ? new Date(a.due_date) : null;
              const isOverdue = due ? due < new Date() : false;
              const domainLabel = a.domain
                ? a.domain.charAt(0) + a.domain.slice(1).toLowerCase()
                : 'Mixed';
              return (
                <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${a.domain ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-secondary-fixed text-on-secondary-fixed'}`}>
                    <span className="material-symbols-outlined text-[18px]">assignment</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-metric-label text-on-surface truncate">{a.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="font-caption text-on-surface-variant text-xs">
                        Domain: <span className="text-primary font-medium">{domainLabel}</span>
                      </span>
                      {due && (
                        <span className={`font-caption text-xs ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
                          Due: {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {isOverdue && ' · Overdue'}
                        </span>
                      )}
                      {!due && <span className="font-caption text-on-surface-variant text-xs">No deadline</span>}
                    </div>
                    {a.instructions && (
                      <p className="font-caption text-on-surface-variant text-xs mt-1 line-clamp-1 italic">"{a.instructions}"</p>
                    )}
                  </div>
                  <DeleteAssessmentButton assessmentId={a.id} cohortId={id} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Roster */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-md text-on-surface">Member Roster</h2>
          <span className="font-caption text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">{studentCount} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant">
                {['Student', 'Email', 'Tests Completed', 'Avg Score', 'Status'].map((h) => (
                  <th key={h} className="py-4 px-6 font-metric-label text-metric-label text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl block mb-2 text-outline">group_off</span>
                    No students enrolled in this cohort yet.
                  </td>
                </tr>
              ) : members.map((m: any, i: number) => {
                const initials = (m.name || m.email || 'U').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
                const colors = ['bg-primary-fixed-dim text-on-primary-fixed', 'bg-tertiary-fixed text-on-tertiary-fixed-variant', 'bg-secondary-fixed text-on-secondary-fixed'];
                const isRisk = m.avgScore !== null && m.avgScore < 60;
                return (
                  <tr key={m.id ?? i} className="hover:bg-surface-container transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${colors[i % 3]}`}>{initials}</div>
                        <p className="font-body-md font-semibold text-on-background group-hover:text-primary transition-colors">{m.name || '—'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-body-md text-on-surface-variant text-sm">{m.email}</td>
                    <td className="py-4 px-6 font-body-md text-on-surface">{m.testsCompleted}</td>
                    <td className="py-4 px-6">
                      {m.avgScore !== null ? (
                        <span className={`font-body-md font-semibold ${isRisk ? 'text-error' : 'text-secondary'}`}>{m.avgScore}%</span>
                      ) : (
                        <span className="text-on-surface-variant font-caption">No data</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {isRisk ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-error-container text-error">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          At Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
