import React from 'react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <aside className="flex flex-col w-64 border-r border-outline-variant bg-surface-container-lowest shrink-0 hidden md:flex sticky top-0 h-screen">
<div className="p-6 flex items-center gap-3 border-b border-outline-variant">
<div className="bg-primary rounded-full size-10 flex items-center justify-center text-on-primary font-display-sm">
                A
            </div>
<div className="flex flex-col">
<h1 className="text-on-surface font-headline-md text-lg">Aptitude Pro</h1>
<p className="text-on-surface-variant font-caption">Student Portal</p>
</div>
</div>
<nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
<a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface font-metric-label transition-colors" href="#">
<span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>dashboard</span>
                Dashboard
            </a>
<a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="#">
<span className="material-symbols-outlined">description</span>
                My Tests
            </a>
<a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="#">
<span className="material-symbols-outlined">analytics</span>
                Reports
            </a>
<a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="#">
<span className="material-symbols-outlined">workspace_premium</span>
                Certificates
            </a>
<a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant font-metric-label transition-colors" href="#">
<span className="material-symbols-outlined">settings</span>
                Settings
            </a>
</nav>
<div className="p-4 border-t border-outline-variant">
<div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant">
<div className="flex-1">
<p className="font-metric-label text-on-surface text-sm">Pro Status</p>
<p className="font-caption text-on-surface-variant">Active Plan</p>
</div>
<span className="material-symbols-outlined text-primary">verified</span>
</div>
</div>
</aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-margin-desktop py-4 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-10">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary md:hidden cursor-pointer">menu</span>
<h2 className="text-on-surface font-headline-md tracking-tight">Welcome back, Aryan!</h2>
</div>
<div className="flex items-center gap-6">

<div className="relative hidden sm:block w-64">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="w-full bg-surface-container-low border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant font-body-md transition-shadow" placeholder="Search assessments..." type="text"/>
</div>

<div className="hidden lg:flex items-center gap-4 text-sm font-metric-label bg-surface-container rounded-full px-4 py-1.5 border border-outline-variant">
<div className="flex items-center gap-1 text-tertiary-container">
<span className="material-symbols-outlined text-base">local_fire_department</span>
<span>12 Day Streak</span>
</div>
<div className="w-px h-4 bg-outline-variant"></div>
<div className="flex items-center gap-1 text-secondary-container">
<span className="material-symbols-outlined text-base">monetization_on</span>
<span className="text-on-surface">2,450 Pts</span>
</div>
</div>

<div className="flex items-center gap-3 cursor-pointer group">
<img alt="Profile" className="size-10 rounded-full border border-outline-variant group-hover:ring-2 ring-primary transition-all object-cover" data-alt="A close-up, high-quality portrait of a young professional man with short dark hair, wearing a casual grey shirt. He is outdoors with a blurred, slightly cool-toned background. The lighting is soft and natural, emphasizing his face. The overall mood is approachable and professional, fitting a modern corporate identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvzag8zTPoVyskCvGHXvy02FaHhs79rMprZdFqixtr1ADefoEBa8Z38wWxPEaH-bstXLvgMGtyMJ48g45uZyKMeVutXw3MyIuZFh5XpgAFcSfk8ni_fdo4j_JbjF-WO633-C2btt-lxZHrFaI92vPprWaIh2Kb9Gbtzu9tnexnAelqvfz4pAYUHhmc0QpYZBWro6D-lVEoGs-ltNbQ164zUnnm7wMOu2sczelot7iKGPJbiIWIEMynEyIEbdHxNl_SkKEHN9IvXeY"/>
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface transition-colors hidden sm:block">arrow_drop_down</span>
</div>
</div>
</header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
