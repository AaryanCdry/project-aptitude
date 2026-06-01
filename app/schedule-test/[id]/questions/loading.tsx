export default function QuestionsStepLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-4 w-20 bg-surface-container-high rounded mb-2" />
        <div className="h-7 w-64 bg-surface-container-high rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="bg-surface-container rounded-xl border border-outline-variant p-4 space-y-3">
          <div className="h-5 w-16 bg-surface-container-high rounded" />
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-3 w-24 bg-surface-container-high rounded" />
                <div className="h-3 w-10 bg-surface-container-high rounded" />
              </div>
              <div className="h-1.5 w-full bg-surface-container-high rounded-full" />
            </div>
          ))}
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5 space-y-4">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-28 bg-surface-container-high rounded-lg" />)}
          </div>
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-surface-container-high rounded-lg" />)}
        </div>
      </div>
    </div>
  );
}
