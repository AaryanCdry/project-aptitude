import React from 'react';

export default function AdminDashboardLoading() {
  return (
    <>
      <header className="mb-10 flex justify-between items-end">
        <div className="w-1/3">
          <div className="h-8 bg-surface-container-high rounded-md w-3/4 animate-pulse"></div>
          <div className="h-4 bg-surface-container-high rounded-md w-1/2 mt-2 animate-pulse"></div>
        </div>
        <div className="h-12 bg-surface-container-high rounded-lg w-40 animate-pulse"></div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="h-4 bg-surface-container-high rounded-md w-1/2 animate-pulse mb-4"></div>
            <div className="flex items-baseline space-x-3 mt-4">
              <div className="h-10 bg-surface-container-high rounded-md w-24 animate-pulse"></div>
              <div className="h-6 bg-surface-container-high rounded-md w-16 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-surface-container-high rounded-md w-1/3 animate-pulse"></div>
            <div className="h-8 bg-surface-container-high rounded-md w-32 animate-pulse"></div>
          </div>
          <div className="h-64 bg-surface-container-high rounded-lg animate-pulse w-full"></div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 flex flex-col">
          <div className="h-6 bg-surface-container-high rounded-md w-2/3 animate-pulse mb-6"></div>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-surface-container-high rounded-md w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-surface-container-high rounded-md w-8 animate-pulse"></div>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
