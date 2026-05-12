import React from 'react';
import { getAdminDashboardData } from '@/app/actions/dashboard';

export default async function AdminDashboard() {
  const { totalStudents, activeTests, averageScore, domainAverages, studentsAtRisk, topPerformers } = await getAdminDashboardData();

  return (
    <>
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-surface">Cohort Overview</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Platform Assessment Cycle</p>
        </div>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-metric-label text-metric-label hover:bg-primary-fixed-variant transition-colors flex items-center space-x-2">
          <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>download</span>
          <span>Export Report</span>
        </button>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <p className="font-metric-label text-metric-label text-on-surface-variant uppercase">Total Students</p>
          <div className="flex items-baseline space-x-3 mt-4">
            <span className="font-display-lg text-display-lg text-primary">{totalStudents}</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <p className="font-metric-label text-metric-label text-on-surface-variant uppercase">Average Percentile</p>
          <div className="flex items-baseline space-x-3 mt-4">
            <span className="font-display-lg text-display-lg text-primary">{averageScore}%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <p className="font-metric-label text-metric-label text-on-surface-variant uppercase">Active Assessments</p>
          <div className="flex items-baseline space-x-3 mt-4">
            <span className="font-display-lg text-display-lg text-primary">{activeTests}</span>
            <span className="font-caption text-caption text-on-surface-variant">in progress</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Performance Trends placeholder -> Could be mapped dynamically but keeping static chart structure for now */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Performance Trends</h2>
            <select className="bg-surface border border-outline-variant text-on-surface rounded-md px-3 py-1 font-caption text-caption">
              <option>All Domains</option>
              <option>Logical</option>
              <option>Quantitative</option>
            </select>
          </div>

          <div className="h-64 relative flex items-end justify-between px-4 pb-8 border-b border-l border-outline-variant">
            <div className="absolute w-full border-t border-outline-variant/30 bottom-1/4"></div>
            <div className="absolute w-full border-t border-outline-variant/30 bottom-2/4"></div>
            <div className="absolute w-full border-t border-outline-variant/30 bottom-3/4"></div>

            <div className="w-12 bg-surface-container flex flex-col justify-end relative group">
              <div className="bg-primary/20 w-full absolute bottom-0 h-24"></div>
              <div className="bg-primary w-full h-16 z-10"></div>
              <span className="absolute -bottom-6 text-caption text-on-surface-variant left-1/2 -translate-x-1/2">Week 1</span>
            </div>
            <div className="w-12 bg-surface-container flex flex-col justify-end relative">
              <div className="bg-primary/20 w-full absolute bottom-0 h-32"></div>
              <div className="bg-primary w-full h-20 z-10"></div>
              <span className="absolute -bottom-6 text-caption text-on-surface-variant left-1/2 -translate-x-1/2">Week 2</span>
            </div>
            <div className="w-12 bg-surface-container flex flex-col justify-end relative">
              <div className="bg-primary/20 w-full absolute bottom-0 h-40"></div>
              <div className="bg-primary w-full h-28 z-10"></div>
              <span className="absolute -bottom-6 text-caption text-on-surface-variant left-1/2 -translate-x-1/2">Week 3</span>
            </div>
            <div className="w-12 bg-surface-container flex flex-col justify-end relative">
              <div className="bg-primary/20 w-full absolute bottom-0 h-36"></div>
              <div className="bg-primary w-full h-32 z-10"></div>
              <span className="absolute -bottom-6 text-caption text-on-surface-variant left-1/2 -translate-x-1/2">Week 4</span>
            </div>
            <div className="w-12 bg-surface-container flex flex-col justify-end relative">
              <div className="bg-primary/20 w-full absolute bottom-0 h-48"></div>
              <div className="bg-primary w-full h-40 z-10 bg-secondary"></div>
              <span className="absolute -bottom-6 text-caption text-on-surface-variant left-1/2 -translate-x-1/2">Week 5</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Cognitive Distribution</h2>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {domainAverages?.length ? domainAverages.map((domain, idx) => {
              const bgColors = ['bg-primary', 'bg-secondary', 'bg-primary/60', 'bg-secondary/60'];
              const colorClass = bgColors[idx % bgColors.length];
              return (
                <div key={domain.domain}>
                  <div className="flex justify-between mb-2">
                    <span className="font-metric-label text-metric-label text-on-surface capitalize">{domain.domain.toLowerCase()}</span>
                    <span className="font-caption text-caption text-on-surface-variant">{domain.average}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass}`} style={{width: `${Math.min(100, Math.max(0, domain.average))}%`}}></div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-on-surface-variant text-body-md">No domain data available yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Students at Risk</h2>
          <div className="space-y-4">
            {studentsAtRisk?.length ? studentsAtRisk.map((student) => {
              const initials = student.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div key={student.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-outline-variant/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold font-metric-label">{initials}</div>
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-on-surface">{student.name}</p>
                      <p className="font-caption text-caption text-error flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">trending_down</span> Avg: {student.average}%</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">visibility</span></button>
                    <button className="p-2 text-on-surface-variant hover:text-secondary transition-colors"><span className="material-symbols-outlined">send</span></button>
                  </div>
                </div>
              );
            }) : (
              <p className="text-on-surface-variant text-body-md">No at-risk students identified.</p>
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Top Performing Students</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Student Name</th>
                  <th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Avg Score</th>
                  <th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Percentile</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {topPerformers?.length ? topPerformers.map((student, idx) => (
                  <tr key={student.id} className="border-b border-outline-variant/50">
                    <td className="py-4 font-semibold">{student.name}</td>
                    <td className="py-4 text-primary font-bold">{student.average}</td>
                    <td className="py-4">Top {Math.max(1, idx * 5)}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-on-surface-variant">No performers data available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
