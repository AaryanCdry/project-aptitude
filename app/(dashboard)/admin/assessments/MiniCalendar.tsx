'use client';

import React, { useMemo, useState } from 'react';

export default function MiniCalendar({ scheduledDates }: { scheduledDates: (string | null)[] }) {
  const realNow = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(realNow.getFullYear());
  const [viewMonth, setViewMonth] = useState(realNow.getMonth());

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = viewYear === realNow.getFullYear() && viewMonth === realNow.getMonth();
  const today = isCurrentMonth ? realNow.getDate() : -1;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: { day: number; current: boolean }[] = [];
  for (let i = startOffset - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  let nextMonthDay = 1;
  while (cells.length % 7 !== 0) { cells.push({ day: nextMonthDay, current: false }); nextMonthDay += 1; }

  const weeks: { day: number; current: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const dayCounts = useMemo(() => {
    const m = new Map<number, number>();
    for (const iso of scheduledDates) {
      if (!iso) continue;
      const d = new Date(iso);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        m.set(d.getDate(), (m.get(d.getDate()) ?? 0) + 1);
      }
    }
    return m;
  }, [scheduledDates, viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(realNow.getFullYear()); setViewMonth(realNow.getMonth()); };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
        <h2 className="font-headline-md text-on-surface">{monthName}</h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-2 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 rounded border border-outline-variant font-metric-label hover:bg-surface-container-high transition-colors text-sm"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-2 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-2 text-center font-metric-label text-on-surface-variant text-xs">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => {
              const count = cell.current ? (dayCounts.get(cell.day) ?? 0) : 0;
              const isToday = cell.current && cell.day === today;
              return (
                <div
                  key={ci}
                  className={`relative text-center p-2 rounded-lg text-sm transition-colors ${
                    !cell.current
                      ? 'text-outline-variant'
                      : isToday
                      ? 'bg-primary text-on-primary font-bold shadow-sm cursor-default'
                      : count > 0
                      ? 'ring-1 ring-secondary/40 bg-secondary-fixed/30 hover:bg-secondary-fixed/50 cursor-pointer text-on-surface font-medium'
                      : 'hover:bg-surface-container-high cursor-pointer text-on-surface'
                  }`}
                >
                  {cell.day}
                  {count > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      isToday ? 'bg-on-primary text-primary' : 'bg-secondary text-on-secondary'
                    }`}>
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
