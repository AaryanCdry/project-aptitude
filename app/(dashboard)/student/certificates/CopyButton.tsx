'use client';

export default function CopyButton({ url }: { url: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(url)}
      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-on-primary rounded-lg font-metric-label hover:opacity-90 transition-opacity"
    >
      <span className="material-symbols-outlined text-xs">share</span>
      Share Link
    </button>
  );
}
