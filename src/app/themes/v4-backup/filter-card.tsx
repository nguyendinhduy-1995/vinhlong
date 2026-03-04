"use client";

import type { ReactNode } from "react";

type FilterCardProps = {
  title?: string;
  children: ReactNode;
};

export function FilterCard({ title = "Bộ lọc", children }: FilterCardProps) {
  return (
    <div className="v4-card rounded-3xl p-4 md:p-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{children}</div>
    </div>
  );
}
