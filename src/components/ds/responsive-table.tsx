"use client";

import React from "react";

/* ─── Types ─── */
export type Column<T> = {
    key: string;
    header: string;
    render: (row: T, index: number) => React.ReactNode;
    /** Hide on mobile card view */
    hideOnMobile?: boolean;
    /** Width hint for desktop table */
    width?: string;
};

export type CardConfig<T> = {
    /** Primary text line (e.g. full name) */
    title: (row: T) => React.ReactNode;
    /** Secondary text line (e.g. phone + status) */
    subtitle?: (row: T) => React.ReactNode;
    /** Trailing content (e.g. actions buttons) */
    trailing?: (row: T) => React.ReactNode;
    /** Click handler for card */
    onClick?: (row: T) => void;
};

type Props<T> = {
    data: T[];
    columns: Column<T>[];
    /** Mobile card configuration */
    card: CardConfig<T>;
    /** Row key extractor */
    keyExtractor: (row: T) => string | number;
    className?: string;
    /** Empty state message */
    emptyMessage?: string;
};

/* ─── Component ─── */
export function ResponsiveTable<T>({
    data,
    columns,
    card,
    keyExtractor,
    className = "",
    emptyMessage = "Không có dữ liệu",
}: Props<T>) {
    if (data.length === 0) {
        return (
            <div className={`glass-2 rounded-2xl p-8 text-center ${className}`}>
                <p className="text-sm text-[color:var(--fg-muted)]">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {/* ── Desktop Table ── */}
            <div className="hidden md:block">
                <div className="glass-2 rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-hairline)]">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[color:var(--fg-muted)]"
                                        style={col.width ? { width: col.width } : undefined}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr
                                    key={keyExtractor(row)}
                                    className="border-b border-[var(--border-hairline)] last:border-0 hover:bg-[var(--hover)] transition-colors"
                                >
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3 text-sm text-[color:var(--fg)]">
                                            {col.render(row, i)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Mobile Card List ── */}
            <div className="md:hidden space-y-2">
                {data.map((row) => (
                    <div
                        key={keyExtractor(row)}
                        className={`glass-2 rounded-2xl p-4 ${card.onClick ? "cursor-pointer tap-feedback" : ""}`}
                        onClick={card.onClick ? () => card.onClick!(row) : undefined}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-[color:var(--fg)] truncate">
                                    {card.title(row)}
                                </div>
                                {card.subtitle && (
                                    <div className="text-xs text-[color:var(--fg-muted)] mt-1">
                                        {card.subtitle(row)}
                                    </div>
                                )}
                            </div>
                            {card.trailing && (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {card.trailing(row)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
