"use client";

import type { ReactNode } from "react";

type FilterCardProps = {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function FilterCard({ title = "Bộ lọc", actions, children }: FilterCardProps) {
  return (
    <div className="glass-2 rounded-2xl p-4" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--fg-muted)' }}>{title}</p>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{children}</div>
    </div>
  );
}
