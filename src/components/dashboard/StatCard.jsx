import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, accentColor }) {
  return (
    <div className="p-4 rounded-2xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[rgb(var(--text-dim))] uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={15} style={{ color: accentColor }} className={!accentColor ? 'text-[rgb(var(--text-dim))]' : ''} />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono text-[rgb(var(--text))] tabular-nums">{value}</span>
      </div>
      {sub && <span className="text-[11px] text-[rgb(var(--text-muted))]">{sub}</span>}
    </div>
  );
}
