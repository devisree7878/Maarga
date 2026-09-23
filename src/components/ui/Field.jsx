import React from 'react';

export function Label({ children }) {
  return <label className="block text-xs font-medium text-[rgb(var(--text-muted))] mb-1.5">{children}</label>;
}

const fieldBase = 'w-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl px-3 py-2.5 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-dim))] focus:outline-none focus:ring-2 accent-ring focus:border-transparent transition-shadow';

export function Input(props) {
  return <input {...props} className={`${fieldBase} ${props.className || ''}`} />;
}

export function Textarea(props) {
  return <textarea {...props} className={`${fieldBase} resize-none ${props.className || ''}`} />;
}

export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${fieldBase} appearance-none cursor-pointer ${props.className || ''}`}>
      {children}
    </select>
  );
}

export function FieldGroup({ label, children }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
    </div>
  );
}
