"use client";

import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   DataTable — glass surface, sticky header, empty/loading states
   ═══════════════════════════════════════════════════════════════ */

type Column<T> = {
    key: string;
    header: string;
    /** Render cell content */
    render: (row: T, index: number) => ReactNode;
    /** Optional width (e.g. "120px", "20%") */
    width?: string;
    /** Align */
    align?: "left" | "center" | "right";
};

type DataTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    /** Row key extractor */
    rowKey: (row: T, index: number) => string;
    /** Loading state — shows skeleton rows */
    loading?: boolean;
    /** Empty state component */
    emptyState?: ReactNode;
    /** Optional className for wrapper */
    className?: string;
    /** Density */
    density?: "comfortable" | "compact";
    /** On row click */
    onRowClick?: (row: T, index: number) => void;
};

export function DataTable<T>({
    columns,
    data,
    rowKey,
    loading = false,
    emptyState,
    className = "",
    density = "comfortable",
    onRowClick,
}: DataTableProps<T>) {
    const py = density === "compact" ? "py-1.5" : "py-2.5";
    const px = "px-4";

    if (loading) {
        return (
            <div className={`glass-2 overflow-hidden animate-pulse ${className}`} style={{ borderRadius: 'var(--radius-lg)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3"
                        style={{ borderBottom: '0.5px solid var(--border-hairline)' }}
                    >
                        <div className="h-4 flex-1 rounded" style={{ background: 'var(--bg-inset)', maxWidth: `${60 + Math.random() * 30}%` }} />
                        <div className="h-4 w-16 rounded" style={{ background: 'var(--bg-inset)' }} />
                    </div>
                ))}
            </div>
        );
    }

    if (data.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    return (
        <div className={`glass-2 overflow-hidden ${className}`} style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left" style={{ fontSize: 'var(--text-sm)' }}>
                    <thead>
                        <tr style={{ borderBottom: '0.5px solid var(--border-hairline)', background: 'var(--bg-inset)' }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`${px} ${py} font-semibold uppercase tracking-wide`}
                                    style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--fg-muted)',
                                        width: col.width,
                                        textAlign: col.align || "left",
                                        position: 'sticky',
                                        top: 0,
                                        background: 'var(--bg-inset)',
                                        zIndex: 2,
                                    }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr
                                key={rowKey(row, idx)}
                                className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                style={{
                                    borderBottom: idx < data.length - 1 ? '0.5px solid var(--border-hairline)' : 'none',
                                }}
                                onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--border-hairline)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={`${px} ${py}`}
                                        style={{ color: 'var(--fg-secondary)', textAlign: col.align || "left" }}
                                    >
                                        {col.render(row, idx)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
