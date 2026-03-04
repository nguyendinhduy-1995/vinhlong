"use client";

import React from "react";

/**
 * Pull-to-refresh indicator for mobile lists.
 * Shows a spinner with progress animation at the top of the list.
 */
export function PullToRefreshIndicator({
    progress,
    pulling,
}: {
    progress: number;
    pulling: boolean;
}) {
    if (progress === 0 && !pulling) return null;

    return (
        <div
            className="flex items-center justify-center py-3 transition-all"
            style={{ opacity: Math.max(progress, pulling ? 1 : 0) }}
        >
            <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 glass-2 text-xs font-medium text-[color:var(--fg-muted)] ${pulling ? "animate-pulse" : ""
                    }`}
            >
                <span
                    className="inline-block text-sm transition-transform"
                    style={{
                        transform: `rotate(${progress * 360}deg)`,
                    }}
                >
                    {pulling ? "⏳" : "↓"}
                </span>
                {pulling ? "Đang tải lại..." : progress >= 1 ? "Thả để tải lại" : "Kéo xuống để tải lại"}
            </div>
        </div>
    );
}

/**
 * Floating Action Button for mobile quick actions.
 */
export function FloatingActionButton({
    onClick,
    icon = "+",
    label = "Thêm",
}: {
    onClick: () => void;
    icon?: string;
    label?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="fixed bottom-24 right-4 z-40 md:hidden flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg transition-all active:scale-95 animate-scale-in"
            style={{
                background: "var(--accent)",
                color: "white",
                boxShadow: "0 8px 30px rgba(0,122,255,0.3)",
            }}
            title={label}
        >
            <span className="text-lg font-bold">{icon}</span>
            <span className="text-sm font-semibold">{label}</span>
        </button>
    );
}
