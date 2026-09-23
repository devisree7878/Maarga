import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, CalendarDays, ListChecks, Code2, Brain, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';

export default function GlobalSearch() {
  const { searchOpen, setSearchOpen, openDay } = useUI();
  const { data } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !searchOpen && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen, setSearchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return null;

    const days = Object.values(data.days)
      .filter((d) => `day ${d.day}`.includes(q) || (d.notes || '').toLowerCase().includes(q))
      .slice(0, 6);

    const tasks = data.tasks
      .filter((t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
      .slice(0, 6);

    const problems = data.problems
      .filter((p) => p.name.toLowerCase().includes(q) || (p.topic || '').toLowerCase().includes(q) || (p.platform || '').toLowerCase().includes(q))
      .slice(0, 6);

    const mistakes = data.mistakes
      .filter((m) => (m.problem || '').toLowerCase().includes(q) || (m.topic || '').toLowerCase().includes(q))
      .slice(0, 6);

    const goals = data.goals.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 6);

    return { days, tasks, problems, mistakes, goals };
  }, [query, data]);

  if (!searchOpen) return null;

  const goToDay = (dayNumber) => {
    setSearchOpen(false);
    openDay(dayNumber);
  };

  const hasAny = results && (results.days.length || results.tasks.length || results.problems.length || results.mistakes.length || results.goals.length);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm anim-fadeIn" onClick={() => setSearchOpen(false)} />
      <div className="relative w-full max-w-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl anim-slideUp max-h-[70vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgb(var(--border-soft))]">
          <Search size={17} className="text-[rgb(var(--text-dim))] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search days, tasks, problems, mistakes, goals..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgb(var(--text-dim))]"
          />
          <button onClick={() => setSearchOpen(false)} className="p-1 rounded-lg text-[rgb(var(--text-dim))] hover:bg-[rgb(var(--surface-2))]"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto scrollbar-none">
          {!results && (
            <p className="text-center text-xs text-[rgb(var(--text-dim))] py-10">Start typing to search everything.</p>
          )}
          {results && !hasAny && (
            <p className="text-center text-xs text-[rgb(var(--text-dim))] py-10">No results for "{query}".</p>
          )}
          {results?.days.length > 0 && (
            <ResultGroup icon={CalendarDays} label="Days">
              {results.days.map((d) => (
                <ResultRow key={d.day} title={`Day ${d.day}`} subtitle={d.notes || d.status.replace('_', ' ')} onClick={() => goToDay(d.day)} />
              ))}
            </ResultGroup>
          )}
          {results?.tasks.length > 0 && (
            <ResultGroup icon={ListChecks} label="Tasks">
              {results.tasks.map((t) => (
                <ResultRow key={t.id} title={t.title} subtitle={`Day ${t.dayNumber}`} onClick={() => goToDay(t.dayNumber)} />
              ))}
            </ResultGroup>
          )}
          {results?.problems.length > 0 && (
            <ResultGroup icon={Code2} label="Problems">
              {results.problems.map((p) => (
                <ResultRow key={p.id} title={p.name} subtitle={[p.platform, p.topic].filter(Boolean).join(' · ')} onClick={() => { setSearchOpen(false); navigate('/problems'); }} />
              ))}
            </ResultGroup>
          )}
          {results?.mistakes.length > 0 && (
            <ResultGroup icon={Brain} label="Mistakes">
              {results.mistakes.map((m) => (
                <ResultRow key={m.id} title={m.problem || m.topic || 'Mistake'} subtitle={m.topic} onClick={() => { setSearchOpen(false); navigate('/mistakes'); }} />
              ))}
            </ResultGroup>
          )}
          {results?.goals.length > 0 && (
            <ResultGroup icon={Target} label="Goals">
              {results.goals.map((g) => (
                <ResultRow key={g.id} title={g.name} subtitle={`${g.current} / ${g.target} ${g.unit}`} onClick={() => { setSearchOpen(false); navigate('/goals'); }} />
              ))}
            </ResultGroup>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultGroup({ icon: Icon, label, children }) {
  return (
    <div className="px-2 py-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--text-dim))]">
        <Icon size={11} /> {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({ title, subtitle, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-[rgb(var(--surface-2))] text-left transition-colors">
      <span className="text-sm text-[rgb(var(--text))] truncate">{title}</span>
      {subtitle && <span className="text-xs text-[rgb(var(--text-dim))] truncate ml-3 shrink-0 max-w-[40%]">{subtitle}</span>}
    </button>
  );
}
