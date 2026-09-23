import React from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useApp } from '../../context/AppContext';

export default function Header({ title, subtitle }) {
  const { setSearchOpen } = useUI();
  const { data, updateSettings } = useApp();
  const isLight = data.settings.theme === 'light';

  return (
    <header className="sticky top-0 z-30 bg-[rgb(var(--bg))]/85 backdrop-blur-lg border-b border-[rgb(var(--border-soft))]">
      <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-4">
        <div className="min-w-0">
          {title && <h1 className="text-lg md:text-xl font-bold text-[rgb(var(--text))] truncate">{title}</h1>}
          {subtitle && <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-dim))] hover:text-[rgb(var(--text-muted))] transition-colors text-sm"
          >
            <Search size={15} />
            <span className="hidden sm:inline">Search everything</span>
            <kbd className="hidden sm:inline text-[10px] bg-[rgb(var(--surface-3))] px-1.5 py-0.5 rounded font-mono ml-1">/</kbd>
          </button>
          <button
            onClick={() => updateSettings({ theme: isLight ? 'dark' : 'light' })}
            className="p-2.5 rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] transition-colors"
            aria-label="Toggle theme"
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
