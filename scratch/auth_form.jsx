

<main className="w-full max-w-[640px] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] overflow-hidden flex flex-col">

<header className="px-8 py-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
<div>
<h1 className="font-display-sm text-display-sm text-on-surface">Manual Enrollment</h1>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">Add a new student to an upcoming assessment cohort.</p>
</div>
<button aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
<span className="material-symbols-outlined">close</span>
</button>
</header>

<div className="p-8 flex flex-col gap-6">

<div className="flex flex-col gap-2">
<label className="font-metric-label text-metric-label text-on-surface" for="fullName">Full Name</label>
<div className="relative">
<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
<span className="material-symbols-outlined text-outline">person</span>
</div>
<input className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" id="fullName" placeholder="e.g. Jane Doe" type="text"/>
</div>
</div>

<div className="flex flex-col gap-2">
<label className="font-metric-label text-metric-label text-on-surface" for="email">Email Address</label>
<div className="relative">
<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
<span className="material-symbols-outlined text-outline">mail</span>
</div>
<input className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" id="email" placeholder="jane.doe@example.com" type="email"/>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

<div className="flex flex-col gap-2">
<label className="font-metric-label text-metric-label text-on-surface" for="cohort">Cohort</label>
<div className="relative">
<select className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none" id="cohort">
<option disabled="" selected="" value="">Select a cohort...</option>
<option value="fall2024">Fall 2024 Intake - Alpha</option>
<option value="spring2025">Spring 2025 Intake - Beta</option>
<option value="custom">Custom Evaluation Group</option>
</select>
<div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
<span className="material-symbols-outlined text-outline">expand_more</span>
</div>
</div>
</div>

<div className="flex flex-col gap-2">
<label className="font-metric-label text-metric-label text-on-surface" for="startDate">Start Date</label>
<div className="relative">
<input className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none text-left" id="startDate" type="date"/>
</div>
</div>
</div>

<div className="mt-4 pt-6 border-t border-outline-variant flex items-center justify-between">
<div>
<h3 className="font-headline-md text-body-lg text-on-surface">Send Invitation</h3>
<p className="font-body-md text-body-md text-on-surface-variant mt-1">Automatically email the student with onboarding instructions and assessment links.</p>
</div>

<div aria-checked="true" className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-primary" role="switch">
<span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-on-primary shadow ring-0 transition duration-200 ease-in-out"></span>
</div>
</div>
</div>

<footer className="px-8 py-6 bg-surface-container flex justify-end gap-4 items-center border-t border-outline-variant">
<button className="px-6 py-3 rounded-lg font-metric-label text-metric-label text-on-surface border border-outline hover:bg-surface-variant transition-colors focus:outline-none focus:ring-2 focus:ring-outline-variant">
                Cancel
            </button>
<button className="px-6 py-3 rounded-lg font-metric-label text-metric-label bg-primary text-on-primary hover:bg-surface-tint shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center gap-2">
<span className="material-symbols-outlined text-[18px]">person_add</span>
                Enroll Student
            </button>
</footer>
</main>
