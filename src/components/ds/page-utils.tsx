"use client";

import React from "react";

/* ═══════════════════════════════════════════════
   ErrorCard — inline error display with retry
   ═══════════════════════════════════════════════ */

export function ErrorCard({
    title = "Đã xảy ra lỗi",
    message,
    onRetry,
}: {
    title?: string;
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div className="glass-2 rounded-2xl p-6 text-center animate-fade-in-up">
            <span className="text-4xl mb-3 block">⚠️</span>
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--danger-fg, #ff3b30)" }}>
                {title}
            </h3>
            {message && (
                <p className="text-sm mb-4" style={{ color: "var(--fg-muted)" }}>
                    {message}
                </p>
            )}
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: "var(--accent)" }}
                >
                    Thử lại
                </button>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   PageHeader — standardized page header
   ═══════════════════════════════════════════════ */

export function PageHeader({
    title,
    subtitle,
    icon,
    badge,
    actions,
}: {
    title: string;
    subtitle?: string;
    icon?: string;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="glass-2 rounded-2xl p-5 md:p-6 animate-fade-in-up">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {icon && <span className="text-2xl">{icon}</span>}
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold" style={{ color: "var(--fg)" }}>
                                {title}
                            </h1>
                            {badge}
                        </div>
                        {subtitle && (
                            <p className="mt-0.5 text-sm" style={{ color: "var(--fg-muted)" }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
        </div>
    );
}
