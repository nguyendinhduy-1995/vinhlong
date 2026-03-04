"use client";

import React from "react";

type Props = {
    from: string;
    to: string;
    onChange: (range: { from: string; to: string }) => void;
    className?: string;
    label?: string;
};

export function DateRangePicker({ from, to, onChange, className = "", label }: Props) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {label && <span className="text-xs font-medium text-[color:var(--fg-muted)] whitespace-nowrap">{label}</span>}
            <div className="flex items-center gap-1.5 rounded-xl glass-1 px-3 py-1.5">
                <input
                    type="date"
                    value={from}
                    onChange={(e) => onChange({ from: e.target.value, to })}
                    className="bg-transparent text-sm font-medium text-[color:var(--fg)] outline-none w-[130px]"
                />
                <span className="text-[color:var(--fg-faint)] text-xs">→</span>
                <input
                    type="date"
                    value={to}
                    onChange={(e) => onChange({ from, to: e.target.value })}
                    className="bg-transparent text-sm font-medium text-[color:var(--fg)] outline-none w-[130px]"
                />
            </div>
        </div>
    );
}
