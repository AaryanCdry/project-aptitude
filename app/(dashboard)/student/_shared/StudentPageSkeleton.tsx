export default function StudentPageSkeleton() {
  return (
    <div className="p-margin-desktop max-w-container-max-width mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-56 bg-surface-container-high rounded-lg mb-2" />
        <div className="h-4 w-80 bg-surface-container-high rounded" />
      </div>

      {/* Cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
            <div className="h-4 w-24 bg-surface-container-high rounded mb-3" />
            <div className="h-8 w-16 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <div className="h-5 w-32 bg-surface-container-high rounded mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-surface-container-high rounded" />
              <div className="h-4 w-5/6 bg-surface-container-high rounded" />
              <div className="h-4 w-4/6 bg-surface-container-high rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
