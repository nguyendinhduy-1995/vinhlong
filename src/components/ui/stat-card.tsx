"use client";

import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "navy" | "gold" | "neutral";
  action?: ReactNode;
};

export function StatCard({ label, value, hint, action }: StatCardProps) {
  return (
    <article className="glass-2 rounded-2xl p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--fg-muted)' }}>{label}</p>
      <p className="text-[28px] font-bold tracking-tight leading-none" style={{ color: 'var(--fg)' }}>{value}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        {hint ? <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>{hint}</p> : <span />}
        {action ? <div className="text-[12px]">{action}</div> : null}
      </div>
    </article>
  );
}
