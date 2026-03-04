"use client";

import React from "react";

/* ─── Status Config ─── */
const STATUS_MAP: Record<string, { label: string; tone: "info" | "success" | "warning" | "danger" | "neutral" }> = {
    /* Lead statuses */
    NEW: { label: "Mới", tone: "info" },
    HAS_PHONE: { label: "Đã có SĐT", tone: "info" },
    APPOINTED: { label: "Đã hẹn", tone: "warning" },
    ARRIVED: { label: "Đã đến", tone: "success" },
    SIGNED: { label: "Đã ký", tone: "success" },
    ENROLLED: { label: "Đang học", tone: "success" },
    LOST: { label: "Rớt", tone: "danger" },
    /* Student statuses */
    ACTIVE: { label: "Đang học", tone: "success" },
    PAUSED: { label: "Tạm dừng", tone: "warning" },
    COMPLETED: { label: "Hoàn thành", tone: "success" },
    /* Automation */
    DONE: { label: "Hoàn thành", tone: "success" },
    FAILED: { label: "Thất bại", tone: "danger" },
    PENDING: { label: "Đang chờ", tone: "warning" },
    RUNNING: { label: "Đang chạy", tone: "info" },
    SKIPPED: { label: "Bỏ qua", tone: "neutral" },
    /* Generic */
    PAID: { label: "Đã thu", tone: "success" },
    UNPAID: { label: "Chưa thu", tone: "danger" },
};

const TONE_CLASSES: Record<string, string> = {
    info: "bg-[var(--accent-bg)] text-[color:var(--accent)]",
    success: "bg-[var(--success-bg)] text-[color:var(--success)]",
    warning: "bg-[var(--warning-bg)] text-[color:var(--warning)]",
    danger: "bg-[var(--danger-bg)] text-[color:var(--danger)]",
    neutral: "bg-[var(--bg-inset)] text-[color:var(--fg-muted)]",
};

type Props = {
    status: string;
    /** Override the displayed label */
    label?: string;
    /** Override the tone */
    tone?: "info" | "success" | "warning" | "danger" | "neutral";
    /** Small dot-only mode */
    dot?: boolean;
    className?: string;
};

export function StatusBadge({ status, label, tone, dot, className = "" }: Props) {
    const config = STATUS_MAP[status] ?? { label: status, tone: "neutral" };
    const resolvedTone = tone ?? config.tone;
    const resolvedLabel = label ?? config.label;
    const classes = TONE_CLASSES[resolvedTone];

    if (dot) {
        return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
                <span className={`h-2 w-2 rounded-full ${classes.split(" ")[0].replace("bg-", "bg-")}`}
                    style={{ backgroundColor: `var(--${resolvedTone === "info" ? "accent" : resolvedTone})` }} />
                {resolvedLabel}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${classes} ${className}`}>
            {resolvedLabel}
        </span>
    );
}
