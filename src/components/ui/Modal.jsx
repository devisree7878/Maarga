import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
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

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm anim-fadeIn" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl shadow-2xl anim-slideUp max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--border-soft))] shrink-0">
          <h3 className="font-semibold text-[rgb(var(--text))]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-[rgb(var(--border-soft))] flex items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
