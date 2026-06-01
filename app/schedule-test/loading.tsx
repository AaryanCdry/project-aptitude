export default function ScheduleTestLoading() {
  return (
    <div className="p-8 max-w-3xl mx-auto animate-pulse">
      <div className="h-6 w-32 bg-surface-container-high rounded mb-2" />
      <div className="h-8 w-64 bg-surface-container-high rounded mb-6" />
      <div className="bg-surface-container rounded-xl border border-outline-variant p-6 space-y-4">
        <div className="h-5 w-40 bg-surface-container-high rounded" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-surface-container-high rounded-lg" />)}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-surface-container-high rounded-lg" />
          <div className="h-10 bg-surface-container-high rounded-lg" />
        </div>
      </div>
    </div>
  );
}
