import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      {Icon && (
        <div className="w-11 h-11 rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] flex items-center justify-center mb-3">
          <Icon size={20} className="text-[rgb(var(--text-dim))]" />
        </div>
      )}
      <p className="text-sm font-medium text-[rgb(var(--text))]">{title}</p>
      {description && <p className="text-xs text-[rgb(var(--text-muted))] mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
