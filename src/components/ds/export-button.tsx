"use client";

import React from "react";

type Props = {
    onClick: () => void;
    label?: string;
    disabled?: boolean;
    className?: string;
};

export function ExportButton({ onClick, label = "Xuất CSV", disabled = false, className = "" }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[color:var(--fg-secondary)] transition-colors hover:bg-[var(--hover)] disabled:opacity-50 ${className}`}
        >
            📥 {label}
        </button>
    );
}
