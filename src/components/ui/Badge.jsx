import React from 'react';

const statusStyles = {
  not_started: 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-dim))] border-[rgb(var(--border))]',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  missed: 'bg-red-500/10 text-red-400 border-red-500/25',
};

const priorityStyles = {
  Low: 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))]',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  High: 'bg-red-500/10 text-red-400 border-red-500/25',
};

const difficultyStyles = {
  Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  Hard: 'bg-red-500/10 text-red-400 border-red-500/25',
};

export default function Badge({ children, tone = 'neutral', className = '' }) {
  const map = { ...statusStyles, ...priorityStyles, ...difficultyStyles };
  const style = map[tone] || map[children] || 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))]';
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${style} ${className}`}>
      {children}
    </span>
  );
}
