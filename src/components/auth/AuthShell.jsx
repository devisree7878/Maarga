import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))] px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shadow-glow">
            <Sparkles size={17} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[rgb(var(--text))]">ELEVORA</span>
        </Link>

        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-bold text-[rgb(var(--text))]">{title}</h1>
            {subtitle && <p className="text-sm text-[rgb(var(--text-muted))] mt-1.5">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-sm text-[rgb(var(--text-muted))]">{footer}</div>}
      </div>
    </div>
  );
}
