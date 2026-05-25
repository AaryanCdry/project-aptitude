'use client';

import React, { useEffect, useRef, useState } from 'react';

export type MultiSelectOption = { value: string; label: string };

interface Props {
  label: string;             // shown in the trigger pill when no value is selected
  options: MultiSelectOption[];
  selected: string[];        // controlled — caller owns state
  onChange: (next: string[]) => void;
  emptyOptionsLabel?: string;
}

// Small click-to-open dropdown with multi-checkbox selection. Closes on
// outside click or Escape. Keep deliberately simple — no virtualisation,
// no search inside the dropdown (filters in this app have <50 options).
export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  emptyOptionsLabel = 'No options',
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (value: string) => {
    const has = selected.includes(value);
    onChange(has ? selected.filter(v => v !== value) : [...selected, value]);
  };

  const summary = selected.length === 0
    ? label
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? '1 selected'
      : `${selected.length} selected`;

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`text-[12px] py-1.5 px-2.5 rounded-md border bg-surface-container-lowest text-on-surface inline-flex items-center gap-1.5 transition-colors ${
          selected.length > 0 ? 'border-primary text-primary' : 'border-outline-variant'
        }`}
      >
        <span className="font-metric-label">{summary}</span>
        <span className="material-symbols-outlined text-[16px]">{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 min-w-[200px] max-h-72 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl py-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-on-surface-variant text-[12px]">{emptyOptionsLabel}</div>
          ) : (
            <>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="block w-full text-left px-3 py-1.5 text-[12px] text-primary hover:bg-surface-container-low transition-colors"
                >
                  Clear selection
                </button>
              )}
              {options.map(opt => {
                const checked = selected.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container-low cursor-pointer text-[13px] text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
