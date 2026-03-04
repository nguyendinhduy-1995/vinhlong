"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`h-10 w-full rounded-2xl px-4 text-sm tracking-tight outline-none transition-all placeholder:opacity-40 focus:ring-2 ${className}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        '--tw-ring-color': 'var(--ring)',
      } as React.CSSProperties}
      {...props}
    />
  );
}
