import React from 'react';

export default function StudentDashboardLoading() {
  return (
    <div className="p-margin-desktop overflow-y-auto">
      <div className="max-w-container-max-width mx-auto flex flex-col gap-gutter">
        {/* Hero Skeleton */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-8 flex items-center justify-between overflow-hidden shadow-sm">
          <div className="flex flex-col gap-4 max-w-lg w-full">
            <div className="h-8 bg-surface-container-high rounded-md w-3/4 animate-pulse"></div>
            <div className="h-4 bg-surface-container-high rounded-md w-full animate-pulse"></div>
            <div className="h-4 bg-surface-container-high rounded-md w-5/6 animate-pulse"></div>
            <div className="h-12 bg-surface-container-high rounded-lg w-48 mt-4 animate-pulse"></div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          {/* Cognitive Profile Skeleton */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-surface-container-high rounded-md w-1/3 animate-pulse"></div>
            </div>
            <div className="flex-1 flex flex-col gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high animate-pulse"></div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 bg-surface-container-high rounded-md w-1/2 animate-pulse"></div>
                    <div className="h-2 bg-surface-container-high rounded-full w-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Trend Skeleton */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-surface-container-high rounded-md w-1/3 animate-pulse"></div>
              <div className="h-6 bg-surface-container-high rounded-md w-24 animate-pulse"></div>
            </div>
            <div className="flex-1 h-48 bg-surface-container-high rounded-lg animate-pulse"></div>
          </div>
        </section>
        
        {/* Recent Activity Skeleton */}
        <section>
          <div className="h-6 bg-surface-container-high rounded-md w-48 mb-4 animate-pulse"></div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            {[1, 2, 3].map((i, idx) => (
              <div key={i} className={`flex items-center justify-between p-4 ${idx < 2 ? 'border-b border-outline-variant' : ''}`}>
                <div className="flex items-center gap-4 w-1/2">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse"></div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 bg-surface-container-high rounded-md w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-surface-container-high rounded-md w-1/2 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-10 bg-surface-container-high rounded-md animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
