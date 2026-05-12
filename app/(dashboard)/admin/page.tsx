import React from 'react';

export default function AdminDashboard() {
  return (
    <>
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="font-display-sm text-display-sm text-on-surface">Cohort Overview</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">Spring 2024 Assessment Cycle</p>
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
<span className="font-display-lg text-display-lg text-primary">1,248</span>
<span className="font-caption text-caption text-secondary font-semibold bg-surface-container-high px-2 py-1 rounded">+12% YoY</span>
</div>
</div>
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
<p className="font-metric-label text-metric-label text-on-surface-variant uppercase">Average Percentile</p>
<div className="flex items-baseline space-x-3 mt-4">
<span className="font-display-lg text-display-lg text-primary">78th</span>
<span className="font-caption text-caption text-secondary font-semibold bg-surface-container-high px-2 py-1 rounded">+2.4 pts</span>
</div>
</div>
<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
<p className="font-metric-label text-metric-label text-on-surface-variant uppercase">Active Assessments</p>
<div className="flex items-baseline space-x-3 mt-4">
<span className="font-display-lg text-display-lg text-primary">342</span>
<span className="font-caption text-caption text-on-surface-variant">in progress</span>
</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

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
<div>
<div className="flex justify-between mb-2">
<span className="font-metric-label text-metric-label text-on-surface">Logical Reasoning</span>
<span className="font-caption text-caption text-on-surface-variant">82%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary" style={{width: '82%'}}></div>
</div>
</div>
<div>
<div className="flex justify-between mb-2">
<span className="font-metric-label text-metric-label text-on-surface">Quantitative</span>
<span className="font-caption text-caption text-on-surface-variant">65%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-secondary" style={{width: '65%'}}></div>
</div>
</div>
<div>
<div className="flex justify-between mb-2">
<span className="font-metric-label text-metric-label text-on-surface">Verbal Comprehension</span>
<span className="font-caption text-caption text-on-surface-variant">74%</span>
</div>
<div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
<div className="h-full bg-primary/60" style={{width: '74%'}}></div>
</div>
</div>
</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
<h2 className="font-headline-md text-headline-md text-on-surface mb-6">Students at Risk</h2>
<div className="space-y-4">

<div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-outline-variant/50">
<div className="flex items-center space-x-4">
<div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold font-metric-label">JD</div>
<div>
<p className="font-body-md text-body-md font-semibold text-on-surface">John Doe</p>
<p className="font-caption text-caption text-error flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">trending_down</span> -15% in Quant</p>
</div>
</div>
<div className="flex space-x-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">visibility</span></button>
<button className="p-2 text-on-surface-variant hover:text-secondary transition-colors"><span className="material-symbols-outlined">send</span></button>
</div>
</div>

<div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-outline-variant/50">
<div className="flex items-center space-x-4">
<div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center font-bold font-metric-label">SM</div>
<div>
<p className="font-body-md text-body-md font-semibold text-on-surface">Sarah Miller</p>
<p className="font-caption text-caption text-error flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">trending_down</span> -12% in Logic</p>
</div>
</div>
<div className="flex space-x-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">visibility</span></button>
<button className="p-2 text-on-surface-variant hover:text-secondary transition-colors"><span className="material-symbols-outlined">send</span></button>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
<h2 className="font-headline-md text-headline-md text-on-surface mb-6">Top Performing Cohorts</h2>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="border-b border-outline-variant">
<th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Cohort</th>
<th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Avg Score</th>
<th className="pb-3 font-metric-label text-metric-label text-on-surface-variant uppercase">Completion</th>
</tr>
</thead>
<tbody className="font-body-md text-body-md text-on-surface">
<tr className="border-b border-outline-variant/50">
<td className="py-4 font-semibold">Engineering 101 - Alpha</td>
<td className="py-4 text-primary font-bold">88.5</td>
<td className="py-4">98%</td>
</tr>
<tr className="border-b border-outline-variant/50">
<td className="py-4 font-semibold">Data Science Bootcamp</td>
<td className="py-4 text-primary font-bold">86.2</td>
<td className="py-4">95%</td>
</tr>
<tr>
<td className="py-4 font-semibold">Business Admin - Fall</td>
<td className="py-4 text-primary font-bold">84.0</td>
<td className="py-4">92%</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
    </>
  );
}
