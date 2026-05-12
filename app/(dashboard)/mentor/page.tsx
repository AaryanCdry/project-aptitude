import React from 'react';

export default function MentorDashboard() {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-gutter lg:px-[40px] lg:py-[32px]">

<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
<div>
<h1 className="font-display-sm text-display-sm text-on-surface">Live Proctoring Dashboard</h1>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">Monitor active assessment sessions and respond to cognitive flags.</p>
</div>
<div className="flex gap-3">
<button className="px-4 py-2 bg-surface text-on-surface border border-outline-variant rounded-lg font-metric-label text-metric-label hover:bg-surface-container-high transition-colors flex items-center space-x-2">
<span className="material-symbols-outlined text-[18px]">warning</span>
<span>Global Warning</span>
</button>
<button className="px-4 py-2 bg-primary-container text-on-primary-container rounded-lg font-metric-label text-metric-label hover:bg-primary hover:text-on-primary transition-colors flex items-center space-x-2">
<span className="material-symbols-outlined text-[18px]">download</span>
<span>Export Logs</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

<div className="bg-surface border border-outline-variant rounded-xl p-6 relative overflow-hidden group hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
<div className="absolute top-0 right-0 p-6 opacity-10">
<span className="material-symbols-outlined text-display-lg" style={{fontVariationSettings: '"FILL" 1'}}>group</span>
</div>
<h3 className="font-metric-label text-metric-label text-on-surface-variant uppercase mb-2">Total Active Students</h3>
<div className="flex items-baseline space-x-2">
<span className="font-display-lg text-display-lg text-on-surface">57</span>
<span className="font-body-md text-body-md text-secondary">in progress</span>
</div>
<div className="mt-4 flex items-center space-x-2 text-caption font-caption">
<span className="w-2 h-2 rounded-full bg-secondary-container"></span>
<span className="text-on-surface-variant">12 completed today</span>
</div>
</div>

<div className="bg-surface border border-outline-variant rounded-xl p-6 relative overflow-hidden group hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
<div className="absolute top-0 right-0 p-6 opacity-10">
<span className="material-symbols-outlined text-display-lg" style={{fontVariationSettings: '"FILL" 1'}}>security</span>
</div>
<h3 className="font-metric-label text-metric-label text-on-surface-variant uppercase mb-2">Active Risk Flags</h3>
<div className="flex items-baseline space-x-2">
<span className="font-display-lg text-display-lg text-error">3</span>
<span className="font-body-md text-body-md text-on-surface-variant">students flagged</span>
</div>
<div className="mt-4 flex items-center space-x-4 text-caption font-caption">
<div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-error"></span><span className="text-on-surface-variant">High (1)</span></div>
<div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span><span className="text-on-surface-variant">Med (2)</span></div>
</div>
</div>

<div className="bg-surface border border-outline-variant rounded-xl p-6 relative overflow-hidden group hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
<div className="absolute top-0 right-0 p-6 opacity-10">
<span className="material-symbols-outlined text-display-lg" style={{fontVariationSettings: '"FILL" 1'}}>router</span>
</div>
<h3 className="font-metric-label text-metric-label text-on-surface-variant uppercase mb-2">Proctoring Uplink</h3>
<div className="flex items-baseline space-x-2">
<span className="font-headline-md text-headline-md text-secondary">Optimal</span>
</div>
<div className="mt-4 flex flex-col space-y-2">
<div className="flex justify-between items-center">
<span className="font-caption text-caption text-on-surface-variant">Latency</span>
<span className="font-caption text-caption font-bold text-on-surface">24ms</span>
</div>
<div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
<div className="bg-secondary h-full" style={{width: '95%'}}></div>
</div>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

<div className="lg:col-span-2 flex flex-col">
<div className="flex justify-between items-end mb-4">
<h2 className="font-headline-md text-headline-md text-on-surface">Live Student Monitoring</h2>
<span className="font-caption text-caption text-on-surface-variant flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">sync</span> Auto-updating</span>
</div>
<div className="bg-surface border border-outline-variant rounded-xl overflow-hidden flex-1">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-low border-b border-outline-variant">
<th className="font-metric-label text-metric-label text-on-surface-variant p-4 font-normal uppercase">Student</th>
<th className="font-metric-label text-metric-label text-on-surface-variant p-4 font-normal uppercase">Assessment</th>
<th className="font-metric-label text-metric-label text-on-surface-variant p-4 font-normal uppercase">Progress</th>
<th className="font-metric-label text-metric-label text-on-surface-variant p-4 font-normal uppercase">Status / Flags</th>
<th className="font-metric-label text-metric-label text-on-surface-variant p-4 font-normal uppercase text-right">Action</th>
</tr>
</thead>
<tbody className="divide-y divide-outline-variant">

<tr className="hover:bg-surface-container-low transition-colors bg-error-container/20">
<td className="p-4">
<div className="flex items-center space-x-3">
<div className="relative">
<img alt="Student" className="w-10 h-10 rounded-full" data-alt="A professional headshot of a young female student with dark hair, looking focused against a minimalist gray background, capturing a clean academic aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBT-2P0e47G3iZSyC4i8UoVB_xQa4JuWEVQviUHP0VKjdxHNoL1LIQY9uTZjcx_tmM2m0929d-h1RhepGyFERH4HUxhD7WLUuXcBhcZduSeELO-dzbmS8Nxfg1FkR6yylifkZrY-Pb0f7X09xRUhMX0mr5np6LjUT6cszUM5dpLj_gNWAYj0jsSWvtAN0d5k35DRv2ewMrGw169HqWNz4hzoitR7xZkMZqK83hsBsg2AbUOU_-XnGAj_aiRSyyQ5kpgdkgMIYD0hTE"/>
<span className="absolute bottom-0 right-0 w-3 h-3 bg-error rounded-full border-2 border-surface"></span>
</div>
<div>
<p className="font-bold text-on-surface text-body-md">Sarah Jenkins</p>
<p className="text-caption font-caption text-on-surface-variant">ID: 4492-A</p>
</div>
</div>
</td>
<td className="p-4">
<p className="font-body-md text-on-surface">Logical Reasoning Drill #4</p>
<p className="text-caption font-caption text-on-surface-variant">Section 2/3</p>
</td>
<td className="p-4">
<div className="flex items-center space-x-2">
<div className="w-16 bg-surface-container-high h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full" style={{width: '45%'}}></div>
</div>
<span className="text-caption font-caption text-on-surface-variant">45%</span>
</div>
</td>
<td className="p-4">
<span className="inline-flex items-center px-2 py-1 rounded text-caption font-caption font-bold bg-error-container text-on-error-container">
<span className="material-symbols-outlined text-[14px] mr-1">warning</span> Multiple Faces
                                    </span>
</td>
<td className="p-4 text-right">
<button className="text-primary hover:text-primary-container p-2 rounded-full hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined">visibility</span>
</button>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors bg-tertiary-fixed-dim/10">
<td className="p-4">
<div className="flex items-center space-x-3">
<div className="relative">
<img alt="Student" className="w-10 h-10 rounded-full" data-alt="A clear, well-lit headshot of a male student looking intently off-camera, set against a pristine white background to maintain a high-end academic feel." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfGmhNGwJsg4LuxmIAA5Xr0x8NjscdDmdxS62l4NXwX6CVyI_VDu7Vltb9n_T_8_2vNcFUPPCqbbKNQ1Ph5xg27g44IpSYMkQXBnFt1n2v7Z_h0ttKu8Hf_xd2MmU6jXq84q7JbtvtzgD-StRH9mEX8AN6eCzhg1LjcILSNO_30Vdew4PrnMxrqdcfgdgKi47bucSKvza-52PKdg7wyMDpLA-FNVzmFl-nYhiNQzndXYPv1wEqLGwvnO8Z_lEhm6OjkynGf0Ck4Q4"/>
<span className="absolute bottom-0 right-0 w-3 h-3 bg-tertiary-fixed-dim rounded-full border-2 border-surface"></span>
</div>
<div>
<p className="font-bold text-on-surface text-body-md">Marcus Chen</p>
<p className="text-caption font-caption text-on-surface-variant">ID: 8812-B</p>
</div>
</div>
</td>
<td className="p-4">
<p className="font-body-md text-on-surface">Quantitative Analysis V2</p>
<p className="text-caption font-caption text-on-surface-variant">Section 1/3</p>
</td>
<td className="p-4">
<div className="flex items-center space-x-2">
<div className="w-16 bg-surface-container-high h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full" style={{width: '15%'}}></div>
</div>
<span className="text-caption font-caption text-on-surface-variant">15%</span>
</div>
</td>
<td className="p-4">
<span className="inline-flex items-center px-2 py-1 rounded text-caption font-caption font-bold bg-tertiary-fixed text-on-tertiary-fixed">
<span className="material-symbols-outlined text-[14px] mr-1">tab</span> Tab Switch
                                    </span>
</td>
<td className="p-4 text-right">
<button className="text-primary hover:text-primary-container p-2 rounded-full hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined">visibility</span>
</button>
</td>
</tr>

<tr className="hover:bg-surface-container-low transition-colors">
<td className="p-4">
<div className="flex items-center space-x-3">
<div className="relative">
<img alt="Student" className="w-10 h-10 rounded-full" data-alt="A high-quality portrait of a female student with glasses, smiling slightly, captured in a bright studio environment with soft neutral lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9PB0OgFZob3vTzITeiXJs1qDm2RK9urn8rUiZedyYggJkr4Yjgqg8vlQ1ipIhpwLAguQloSQgHQFjAqC4xb7o1q919m74Kfmpf0cxsw4Lx4GBMmfmXz4eHSjRqQZam6WNQWOzzRFCnnH8L5GaI9DRpIJzTFA6HXjlkqEjs3Z6_oaw11ZR9rMG3zEtTZ0_yhjvnFP1l2o9IeQQ2scTC2altDWXvAgrtrhZEi8vj_0zB7m_-Gvb93gAMCAbTsFp3nKPMrFW8_PcSK4"/>
<span className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-surface"></span>
</div>
<div>
<p className="font-bold text-on-surface text-body-md">Elena Rodriguez</p>
<p className="text-caption font-caption text-on-surface-variant">ID: 1093-C</p>
</div>
</div>
</td>
<td className="p-4">
<p className="font-body-md text-on-surface">Spatial Reasoning Core</p>
<p className="text-caption font-caption text-on-surface-variant">Section 3/3</p>
</td>
<td className="p-4">
<div className="flex items-center space-x-2">
<div className="w-16 bg-surface-container-high h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full" style={{width: '88%'}}></div>
</div>
<span className="text-caption font-caption text-on-surface-variant">88%</span>
</div>
</td>
<td className="p-4">
<span className="inline-flex items-center px-2 py-1 rounded text-caption font-caption text-on-surface-variant">
<span className="material-symbols-outlined text-[14px] mr-1 text-secondary">check_circle</span> Clean
                                    </span>
</td>
<td className="p-4 text-right">
<button className="text-primary hover:text-primary-container p-2 rounded-full hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined">visibility</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
</div>

<div className="flex flex-col space-y-6">

<div className="bg-surface border border-outline-variant rounded-xl p-6">
<h2 className="font-headline-md text-headline-md text-on-surface mb-4">Cohort Performance</h2>
<p className="font-caption text-caption text-on-surface-variant mb-6">Average score trajectory across domains for your assigned students.</p>
<div className="space-y-4">

<div>
<div className="flex justify-between text-caption font-caption mb-1">
<span className="font-bold text-on-surface">Logical</span>
<span className="text-primary font-bold">78%</span>
</div>
<div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{width: '78%'}}></div>
</div>
</div>

<div>
<div className="flex justify-between text-caption font-caption mb-1">
<span className="font-bold text-on-surface">Verbal</span>
<span className="text-primary font-bold">82%</span>
</div>
<div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{width: '82%'}}></div>
</div>
</div>

<div>
<div className="flex justify-between text-caption font-caption mb-1">
<span className="font-bold text-on-surface">Quantitative</span>
<span className="text-primary font-bold">64%</span>
</div>
<div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{width: '64%'}}></div>
</div>
</div>

<div>
<div className="flex justify-between text-caption font-caption mb-1">
<span className="font-bold text-on-surface">Spatial</span>
<span className="text-primary font-bold">71%</span>
</div>
<div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full" style={{width: '71%'}}></div>
</div>
</div>
</div>
</div>

<div className="bg-surface border border-outline-variant rounded-xl p-6">
<h2 className="font-headline-md text-headline-md text-on-surface mb-4">Critical Controls</h2>
<div className="flex flex-col space-y-3">
<button className="w-full py-3 px-4 bg-surface text-on-surface border border-outline-variant rounded-lg font-metric-label text-metric-label hover:bg-surface-container-high transition-colors flex items-center justify-between group">
<div className="flex items-center space-x-2">
<span className="material-symbols-outlined text-tertiary-fixed-dim">chat_bubble</span>
<span>Message All Students</span>
</div>
<span className="material-symbols-outlined text-outline-variant group-hover:text-on-surface">chevron_right</span>
</button>
<button className="w-full py-3 px-4 bg-error-container text-on-error-container rounded-lg font-metric-label text-metric-label hover:bg-error hover:text-on-error transition-colors flex items-center justify-between group">
<div className="flex items-center space-x-2">
<span className="material-symbols-outlined">block</span>
<span>End All Sessions</span>
</div>
<span className="material-symbols-outlined opacity-50 group-hover:opacity-100">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
</div>
    </>
  );
}
