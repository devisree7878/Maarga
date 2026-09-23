import React from 'react';
import { dateForDay, formatShort } from '../../utils/dateUtils';
import { dayTaskStats } from '../../utils/statsUtils';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';

const statusDot = {
  not_started: 'bg-[rgb(var(--text-dim))]',
  in_progress: 'bg-blue-400',
  completed: 'bg-emerald-400',
  missed: 'bg-red-400',
};

const statusRing = {
  not_started: 'border-[rgb(var(--border))]',
  in_progress: 'border-blue-500/40',
  completed: 'border-emerald-500/40',
  missed: 'border-red-500/40',
};

export default function DayCard({ dayNumber, isToday }) {
  const { data } = useApp();
  const { openDay } = useUI();
  const day = data.days[dayNumber];
  const stats = dayTaskStats(data, dayNumber);
  const date = dateForDay(data.settings.startDate, dayNumber);

  return (
    <button
      id={`day-${dayNumber}`}
      onClick={() => openDay(dayNumber)}
      className={`relative flex flex-col items-start gap-1.5 p-2.5 rounded-xl border bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-2))] hover:-translate-y-0.5 transition-all text-left group ${statusRing[day.status]} ${
        isToday ? 'ring-2 accent-ring' : ''
      }`}
    >
      {isToday && <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold accent-bg text-white px-1.5 py-0.5 rounded-full">TODAY</span>}
      <div className="flex items-center justify-between w-full">
        <span className="text-[13px] font-bold font-mono text-[rgb(var(--text))]">{dayNumber}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[day.status]}`} />
      </div>
      <span className="text-[10px] text-[rgb(var(--text-dim))] font-mono">{formatShort(date)}</span>
      {stats.total > 0 ? (
        <>
          <div className="w-full h-1 rounded-full bg-[rgb(var(--surface-3))] overflow-hidden">
            <div className={`h-full rounded-full ${day.status === 'completed' ? 'bg-emerald-400' : day.status === 'missed' ? 'bg-red-400' : 'accent-bg'}`} style={{ width: `${stats.pct}%` }} />
          </div>
          <span className="text-[9px] text-[rgb(var(--text-dim))] font-mono">{stats.completed}/{stats.total}</span>
        </>
      ) : (
        <span className="text-[9px] text-[rgb(var(--text-dim))]">—</span>
      )}
    </button>
  );
}
