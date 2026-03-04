"use client";

import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

type DataTableProps = {
  loading?: boolean;
  error?: string;
  isEmpty?: boolean;
  emptyText?: string;
  children: ReactNode;
};

export function DataTable({
  loading = false,
  error = "",
  isEmpty = false,
  emptyText = "Không có dữ liệu",
  children,
}: DataTableProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm text-[color:var(--fg-secondary)] shadow-sm">
        <Spinner /> Đang tải...
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-[color:var(--fg-secondary)] shadow-sm">
        {emptyText}
      </div>
    );
  }

  return <>{children}</>;
}
