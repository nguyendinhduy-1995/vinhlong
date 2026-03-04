"use client";

import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`h-[38px] w-full rounded-xl px-3.5 text-[15px] outline-none transition-all focus:ring-2 ${className}`}
      style={{
        background: 'var(--bg-inset)',
        border: '0.5px solid var(--border-hairline)',
        color: 'var(--fg)',
        '--tw-ring-color': 'var(--border-focus)',
      } as React.CSSProperties}
      {...props}
    />
  );
}
