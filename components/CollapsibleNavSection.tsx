'use client';

import { useEffect, useState } from 'react';

interface CollapsibleNavSectionProps {
  storageKey: string;
  label: string;
  children: React.ReactNode;
}

export default function CollapsibleNavSection({ storageKey, label, children }: CollapsibleNavSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setCollapsed(stored === 'true');
    }
  }, [storageKey]);

  function toggle(event: React.MouseEvent) {
    event.stopPropagation();
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 pt-4 pb-1 font-caption text-on-surface-variant text-xs font-semibold uppercase tracking-wide"
      >
        <span>{label}</span>
        <span className="material-symbols-outlined text-[16px]">
          {collapsed ? 'expand_more' : 'expand_less'}
        </span>
      </button>
      {!collapsed && <div className="flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}
