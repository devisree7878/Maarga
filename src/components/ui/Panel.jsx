import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Renders as a right-side drawer on md+ screens, and a full-screen
// slide-up sheet on mobile. Used for the Day detail panel.
export default function Panel({ open, onClose, title, subtitle, headerExtra, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm anim-fadeIn" onClick={onClose} />
      <div
        className="absolute bg-[rgb(var(--surface))] border-[rgb(var(--border))] flex flex-col
          inset-x-0 bottom-0 top-12 rounded-t-3xl border-t anim-slideInUp
          md:inset-y-0 md:right-0 md:left-auto md:top-0 md:w-[480px] md:rounded-none md:border-t-0 md:border-l md:anim-slideInRight"
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[rgb(var(--border-soft))] shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[rgb(var(--text))] truncate">{title}</h2>
            {subtitle && <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {headerExtra}
            <button onClick={onClose} className="p-2 rounded-lg text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))] transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-[rgb(var(--border-soft))] shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
