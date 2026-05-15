import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <nav className="hidden md:flex flex-col py-gutter px-4 space-y-2 docked h-screen left-0 w-64 border-r border-outline-variant bg-surface-container-low text-primary flex-shrink-0 sticky top-0">
        <div className="mb-8 px-4 pt-6">
          <span className="text-headline-md font-headline-md text-primary font-bold">AptitudePro</span>
        </div>
        <div className="flex items-center space-x-3 px-4 py-3 mb-6">
          <img alt="User Avatar" className="w-10 h-10 rounded-full bg-surface-container-high" data-alt="A professional headshot of a mature male executive or educator in a tailored suit against a neutral studio background. The lighting is crisp and corporate, fitting an administrative dashboard context." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAMU7-tqvIwqQLMYXXF-N5kSxZ0mJUciz2Zblal42ui2skrng7gGaig16u5gbmkVllKv8nJeh8Os1YQHn24mwSineyD-05Q8QOLzqYm_9abfkJQIZ7TlPvbRFf6Cq4w_EyOId_RY6HEqjaI7yQvePya0kkXu3rQ14qV4dJEkXWHKHLDPmunYF-Ei-LioaFNm0npPeipRB7yfpSgBFCyD8ommJdzpwSmnXDI1dlbs0kExUKsC1AE70Kihu_nu4bJ2mdh2xaFec5xAc"/>
          <div>
            <p className="font-headline-md text-[16px] font-bold text-on-surface">Alex Rivers</p>
            <p className="font-caption text-caption text-on-surface-variant">Level 4 Analyst</p>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>dashboard</span>
            <span>Overview</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/questions">
            <span className="material-symbols-outlined">quiz</span>
            <span>Questions</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/cohorts">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>group</span>
            <span>Cohorts</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/assessments">
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Scheduling</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/enrollment">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>group_add</span>
            <span>Enrollment</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/departments">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>account_tree</span>
            <span>Departments</span>
          </Link>
          <Link className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="/admin/classes">
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>meeting_room</span>
            <span>Classes</span>
          </Link>
          <a className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg opacity-50 cursor-not-allowed" href="#">
            <span className="material-symbols-outlined">trending_up</span>
            <span>Analytics</span>
          </a>
          <a className="flex items-center space-x-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high hover:bg-surface-container-highest transition-all rounded-lg" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
        </div>
      </nav>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
