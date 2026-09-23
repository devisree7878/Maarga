import React from 'react';

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-[rgb(var(--border-soft))] -mx-5 px-5">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text-muted))]'
            }`}
          >
            {t.icon && <t.icon size={14} />}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[10px] bg-[rgb(var(--surface-3))] px-1.5 rounded-full">{t.count}</span>
            )}
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-0.5 accent-bg rounded-full" />}
          </button>
        );
      })}
    </div>
  );
}
