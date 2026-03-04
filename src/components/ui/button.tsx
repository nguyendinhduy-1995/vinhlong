"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
};

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, { cls: string; style: React.CSSProperties }> = {
  primary: {
    cls: "text-white font-semibold shadow-sm hover:brightness-110 active:scale-[0.97]",
    style: { background: 'var(--accent)' },
  },
  secondary: {
    cls: "font-semibold hover:brightness-95 active:scale-[0.97]",
    style: { background: 'var(--bg-elevated)', border: '0.5px solid var(--border-subtle)', color: 'var(--fg)' },
  },
  danger: {
    cls: "text-white font-semibold shadow-sm hover:brightness-110 active:scale-[0.97]",
    style: { background: 'var(--danger)' },
  },
  ghost: {
    cls: "font-medium hover:brightness-95 active:scale-[0.97]",
    style: { color: 'var(--accent)', background: 'transparent' },
  },
  accent: {
    cls: "text-white font-semibold shadow-md hover:brightness-110 active:scale-[0.97]",
    style: { background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' },
  },
};

export function Button({ variant = "primary", className = "", style, ...props }: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <button
      className={`inline-flex h-[38px] items-center justify-center rounded-xl px-4 text-[13px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 ${v.cls} ${className}`}
      style={{ '--tw-ring-color': 'var(--border-focus)', ...v.style, ...style } as React.CSSProperties}
      {...props}
    />
  );
}
