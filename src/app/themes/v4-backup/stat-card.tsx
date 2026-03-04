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
    <article className="v4-card rounded-3xl p-5 group">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>{value}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {hint ? <p className="text-xs" style={{ color: 'var(--muted)' }}>{hint}</p> : <span />}
        {action ? <div className="text-xs">{action}</div> : null}
      </div>
    </article>
  );
}
