import React, { useMemo, useState } from 'react';
import { Search, Target } from 'lucide-react';
import DayCard from './DayCard';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';
import { currentDayNumber } from '../../utils/dateUtils';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'missed', label: 'Missed' },
];

export default function CalendarGrid() {
  const { data } = useApp();
  const { openDay } = useUI();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const todayDay = currentDayNumber(data.settings.startDate, data.settings.duration);

  const days = useMemo(() => {
    let list = Array.from({ length: data.settings.duration }, (_, i) => i + 1);
    if (filter !== 'all') list = list.filter((n) => data.days[n].status === filter);
    if (query.trim()) {
      const q = query.trim();
      list = list.filter((n) => String(n).includes(q));
    }
    return list;
  }, [data, filter, query]);

  const jumpToToday = () => {
    openDay(todayDay);
    setTimeout(() => document.getElementById(`day-${todayDay}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f.id ? 'accent-bg text-white' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-dim))]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to day #"
              className="w-32 pl-8 pr-2 py-1.5 rounded-lg bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-xs outline-none focus:ring-2 accent-ring"
            />
          </div>
          <button onClick={jumpToToday} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] border border-[rgb(var(--border))] whitespace-nowrap">
            <Target size={12} /> Today
          </button>
        </div>
      </div>

      {days.length === 0 ? (
        <p className="text-center text-sm text-[rgb(var(--text-dim))] py-12">No days match this filter.</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {days.map((n) => (
            <DayCard key={n} dayNumber={n} isToday={n === todayDay} />
          ))}
        </div>
      )}
    </div>
  );
}
