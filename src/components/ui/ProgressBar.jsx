import React from 'react';

export default function ProgressBar({ value = 0, className = '', height = 'h-2', color, trackClassName = '' }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`w-full ${height} rounded-full bg-[rgb(var(--surface-3))] overflow-hidden ${trackClassName} ${className}`}>
      <div
        className={`${height} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${pct}%`, background: color || 'linear-gradient(90deg, rgb(var(--accent)), rgb(var(--accent-2)))' }}
      />
    </div>
  );
}
