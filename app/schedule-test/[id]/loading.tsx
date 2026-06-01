export default function ScheduleTestIdLoading() {
  return (
    <div className="p-8 max-w-3xl mx-auto animate-pulse">
      <div className="h-6 w-24 bg-surface-container-high rounded mb-2" />
      <div className="h-8 w-72 bg-surface-container-high rounded mb-6" />
      <div className="bg-surface-container rounded-xl border border-outline-variant p-6 space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-surface-container-high rounded-lg" />)}
      </div>
    </div>
  );
}
