"use client";

import React, { useState } from "react";

type FilterItem = {
    key: string;
    label: string;
    type: "select" | "text" | "date";
    options?: { value: string; label: string }[];
    placeholder?: string;
};

type Props = {
    filters: FilterItem[];
    values: Record<string, string>;
    onChange: (key: string, value: string) => void;
    onReset?: () => void;
    className?: string;
};

export function FilterBar({ filters, values, onChange, onReset, className = "" }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);

    // On mobile, show first 2 filters + toggle
    const visibleFilters = isExpanded ? filters : filters.slice(0, 2);
    const hasMore = filters.length > 2;

    return (
        <div className={`glass-2 rounded-2xl p-4 ${className}`}>
            <div className="flex flex-wrap items-end gap-3">
                {visibleFilters.map((f) => (
                    <div key={f.key} className="flex flex-col gap-1 min-w-[140px] flex-1 max-w-[220px]">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--fg-muted)]">
                            {f.label}
                        </label>
                        {f.type === "select" ? (
                            <select
                                value={values[f.key] ?? ""}
                                onChange={(e) => onChange(f.key, e.target.value)}
                                className="h-9 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 text-sm text-[color:var(--fg)] outline-none focus:border-[var(--border-focus)] transition-colors"
                            >
                                {f.options?.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        ) : f.type === "date" ? (
                            <input
                                type="date"
                                value={values[f.key] ?? ""}
                                onChange={(e) => onChange(f.key, e.target.value)}
                                className="h-9 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 text-sm text-[color:var(--fg)] outline-none focus:border-[var(--border-focus)] transition-colors"
                            />
                        ) : (
                            <input
                                type="text"
                                placeholder={f.placeholder ?? "Tìm kiếm..."}
                                value={values[f.key] ?? ""}
                                onChange={(e) => onChange(f.key, e.target.value)}
                                className="h-9 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 text-sm text-[color:var(--fg)] outline-none focus:border-[var(--border-focus)] transition-colors"
                            />
                        )}
                    </div>
                ))}

                <div className="flex items-center gap-2 pb-0.5">
                    {hasMore && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-9 rounded-xl px-3 text-xs font-medium text-[color:var(--accent)] hover:bg-[var(--hover)] transition-colors"
                        >
                            {isExpanded ? "Thu gọn" : `+${filters.length - 2} bộ lọc`}
                        </button>
                    )}
                    {onReset && (
                        <button
                            onClick={onReset}
                            className="h-9 rounded-xl px-3 text-xs font-medium text-[color:var(--fg-muted)] hover:bg-[var(--hover)] transition-colors"
                        >
                            Đặt lại
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
