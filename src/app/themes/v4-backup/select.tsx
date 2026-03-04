"use client";

import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`h-10 w-full rounded-2xl px-4 text-sm tracking-tight outline-none transition-all focus:ring-2 ${className}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        '--tw-ring-color': 'var(--ring)',
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </select>
  );
}
