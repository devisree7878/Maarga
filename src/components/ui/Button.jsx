import React from 'react';

const variants = {
  primary: 'accent-bg text-white hover:brightness-110 shadow-glow',
  secondary: 'bg-[rgb(var(--surface-3))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border))] border border-[rgb(var(--border))]',
  ghost: 'bg-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
  outline: 'bg-transparent border border-[rgb(var(--border))] text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]',
};

const sizes = {
  sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-3.5 py-2 rounded-xl gap-2',
  lg: 'text-sm px-5 py-3 rounded-xl gap-2',
  icon: 'p-2 rounded-lg',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
