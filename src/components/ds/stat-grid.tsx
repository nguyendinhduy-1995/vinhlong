"use client";

import React from "react";

type StatItem = {
    label: string;
    value: string | number;
    sub?: string;
    icon?: React.ReactNode;
    tone?: "default" | "success" | "danger" | "warning" | "accent";
    onClick?: () => void;
};

type Props = {
    items: StatItem[];
    columns?: 2 | 3 | 4;
    className?: string;
};

const VALUE_TONE: Record<string, string> = {
    default: "text-[color:var(--fg)]",
    success: "text-[color:var(--success)]",
    danger: "text-[color:var(--danger)]",
    warning: "text-[color:var(--warning)]",
    accent: "text-[color:var(--accent)]",
};

export function StatGrid({ items, columns = 3, className = "" }: Props) {
    const gridClass = columns === 2
        ? "grid-cols-2"
        : columns === 4
            ? "grid-cols-2 md:grid-cols-4"
            : "grid-cols-2 md:grid-cols-3";

    return (
        <div className={`grid ${gridClass} gap-3 ${className}`}>
            {items.map((item, i) => (
                <div
                    key={i}
                    className={`glass-2 rounded-2xl p-4 ${item.onClick ? "cursor-pointer tap-feedback" : ""}`}
                    onClick={item.onClick}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--fg-muted)] mb-1.5">
                                {item.label}
                            </p>
                            <p className={`text-xl font-bold tracking-tight ${VALUE_TONE[item.tone ?? "default"]}`}>
                                {item.value}
                            </p>
                            {item.sub && (
                                <p className="text-[11px] text-[color:var(--fg-muted)] mt-0.5">{item.sub}</p>
                            )}
                        </div>
                        {item.icon && (
                            <div className="text-lg opacity-60 ml-2">{item.icon}</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
