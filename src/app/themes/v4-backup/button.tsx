"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border-0 text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.97]",
  secondary:
    "bg-white hover:bg-[var(--card-hover)] active:scale-[0.97]",
  danger:
    "border-0 bg-red-500 text-white shadow-md hover:bg-red-600 hover:shadow-lg active:scale-[0.97]",
  ghost:
    "border border-transparent bg-transparent hover:bg-black/5 active:scale-[0.97]",
  accent:
    "border-0 text-white shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.97]",
};

export function Button({ variant = "primary", className = "", style, ...props }: ButtonProps) {
  const warmStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', boxShadow: '0 4px 14px rgba(232,115,74,0.2)' },
    secondary: { border: '1px solid var(--border)', color: 'var(--text-secondary)' },
    danger: {},
    ghost: { color: 'var(--text-secondary)' },
    accent: { background: 'linear-gradient(135deg, var(--accent) 0%, #D4613D 100%)', boxShadow: '0 4px 16px rgba(232,115,74,0.25)' },
  };

  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-2xl px-5 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      style={{ ...warmStyles[variant], '--tw-ring-color': 'var(--ring)', ...style } as React.CSSProperties}
      {...props}
    />
  );
}
