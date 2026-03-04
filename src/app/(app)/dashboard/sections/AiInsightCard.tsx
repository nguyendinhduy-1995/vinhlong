"use client";

import React from "react";

/* ═══════════════════════════════════════════════════════════════
   AiInsightCard — 3 bullet AI insight (nhận định / cảnh báo / đề xuất)
   ═══════════════════════════════════════════════════════════════ */

interface AiInsight {
    observation: string;
    warning: string;
    action: string;
}

export function AiInsightCard({ insight, loading }: { insight: AiInsight | null; loading?: boolean }) {
    if (loading) {
        return (
            <div className="glass-2 rounded-xl p-3 animate-pulse space-y-2">
                <div className="h-3 w-1/3 rounded bg-[var(--bg-inset)]" />
                <div className="h-3 w-2/3 rounded bg-[var(--bg-inset)]" />
                <div className="h-3 w-1/2 rounded bg-[var(--bg-inset)]" />
            </div>
        );
    }

    if (!insight) return null;

    return (
        <div className="glass-2 rounded-xl p-3 space-y-1.5 animate-fade-in-up text-sm">
            <div className="flex items-start gap-2">
                <span className="shrink-0">💡</span>
                <span style={{ color: "var(--fg)" }}>{insight.observation}</span>
            </div>
            {insight.warning && (
                <div className="flex items-start gap-2">
                    <span className="shrink-0">⚠️</span>
                    <span style={{ color: "var(--warning-fg)" }}>{insight.warning}</span>
                </div>
            )}
            <div className="flex items-start gap-2">
                <span className="shrink-0">🎯</span>
                <span style={{ color: "var(--accent)" }}>{insight.action}</span>
            </div>
        </div>
    );
}
