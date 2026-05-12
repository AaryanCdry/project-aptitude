import React from 'react';

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <nav className="hidden md:flex flex-col py-gutter px-4 space-y-2 docked h-screen left-0 w-64 bg-surface-container-low dark:bg-on-surface border-r border-outline-variant dark:border-outline">
<div className="mb-8 px-4 flex items-center space-x-3">
<span className="material-symbols-outlined text-primary dark:text-primary-fixed" style={{fontVariationSettings: '"FILL" 1'}}>neurology</span>
<span className="text-headline-md font-headline-md text-primary">AptitudePro</span>
</div>
<div className="flex flex-col space-y-1 flex-1">
<a className="flex items-center space-x-3 px-4 py-3 bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-lg font-bold transition-all hover:bg-surface-container-highest dark:hover:bg-primary-fixed-dim/10" href="#">
<span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>dashboard</span>
<span>Dashboard</span>
</a>
<a className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high rounded-lg transition-all hover:bg-surface-container-highest dark:hover:bg-primary-fixed-dim/10" href="#">
<span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>group</span>
<span>My Students</span>
</a>
<a className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high rounded-lg transition-all hover:bg-surface-container-highest dark:hover:bg-primary-fixed-dim/10" href="#">
<span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>videocam</span>
<span>Live Sessions</span>
</a>
<a className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high rounded-lg transition-all hover:bg-surface-container-highest dark:hover:bg-primary-fixed-dim/10" href="#">
<span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>trending_up</span>
<span>Analytics</span>
</a>
<a className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-high rounded-lg transition-all hover:bg-surface-container-highest dark:hover:bg-primary-fixed-dim/10" href="#">
<span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>settings</span>
<span>Settings</span>
</a>
</div>
<div className="mt-auto pt-4 border-t border-outline-variant dark:border-outline">
<div className="flex items-center space-x-3 px-4 py-3">
<img alt="Prof. Davis" className="w-10 h-10 rounded-full" data-alt="A highly professional corporate headshot of a middle-aged male mentor with short graying hair, wearing a clean white shirt and dark blazer. The lighting is bright and modern, set against a pristine, minimalist office background that aligns with an authoritative academic aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1ASqd0PzMdWX9B-kNwb-Tt8SdQJ-O9wcXclx0nX77ckrhu7WBsCvKw4UZJtdO3JvyA_0WQpWhWalF_cAbwxROLLQOEnVb7jkZh9ONt3oFIsDBtIW0Y3HmjOOZEAp9kx1f9hZrded4Dji7l0vKH6Abi7wFJ3mZHNQ11ugHTCq9fGtqekAACqoHNDTYXmRasVVX8BC5LgZW81boMM5CTZByua0w5EsVvazP7LuVx4BOFhNdgUxU7jSBuvpgVuQr_M654mouru6NjEU"/>
<div>
<p className="font-bold text-on-surface">Prof. Davis</p>
<p className="text-caption font-caption text-on-surface-variant">Senior Mentor</p>
</div>
</div>
<button className="w-full mt-2 py-2 bg-primary-container text-on-primary-container font-metric-label text-metric-label rounded-lg flex justify-center items-center space-x-2 hover:bg-primary hover:text-on-primary transition-colors">
<span className="material-symbols-outlined text-[18px]">upgrade</span>
<span>Upgrade Plan</span>
</button>
</div>
</nav>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex justify-between items-center w-full px-gutter h-16 bg-surface dark:bg-on-surface border-b border-outline-variant dark:border-outline top-0 docked full-width">
<span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">AptitudePro</span>
<button className="text-primary dark:text-primary-fixed">
<span className="material-symbols-outlined">menu</span>
</button>
</header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
