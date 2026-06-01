export default function AdminPageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 w-48 bg-surface-container-high rounded-lg mb-2" />
        <div className="h-4 w-96 bg-surface-container-high rounded" />
      </div>

      {/* Card / form area */}
      <div className="max-w-2xl bg-surface-container rounded-xl border border-outline-variant p-6 mb-8 space-y-4">
        <div className="h-5 w-40 bg-surface-container-high rounded" />
        <div className="h-10 bg-surface-container-high rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-surface-container-high rounded-lg" />
          <div className="h-10 bg-surface-container-high rounded-lg" />
        </div>
        <div className="h-10 bg-surface-container-high rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
          <div className="h-5 w-48 bg-surface-container-high rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-surface-container-high rounded-full" />
            <div className="h-8 w-24 bg-surface-container-high rounded-full" />
            <div className="h-8 w-24 bg-surface-container-high rounded-full" />
          </div>
        </div>
        <div className="divide-y divide-outline-variant">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-1/4 bg-surface-container-high rounded" />
              <div className="h-4 w-1/6 bg-surface-container-high rounded" />
              <div className="h-4 w-1/6 bg-surface-container-high rounded" />
              <div className="h-6 w-20 bg-surface-container-high rounded-full" />
              <div className="h-4 flex-1 bg-surface-container-high rounded" />
              <div className="h-8 w-16 bg-surface-container-high rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
