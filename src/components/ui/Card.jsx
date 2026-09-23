import React from 'react';

export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
