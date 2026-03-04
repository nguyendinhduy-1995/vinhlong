"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  title = "Không có dữ liệu",
  description = "Hãy thay đổi bộ lọc hoặc tạo mới dữ liệu.",
  action,
}: EmptyStateProps) {
  return (
    <div className="surface rounded-2xl px-4 py-8 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]" aria-hidden="true" />
      <p className="text-sm font-semibold text-[color:var(--fg)]">{title}</p>
      <p className="mt-1 text-xs text-[color:var(--fg-muted)]">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
