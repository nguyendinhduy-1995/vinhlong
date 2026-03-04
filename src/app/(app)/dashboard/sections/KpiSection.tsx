"use client";

import React from "react";
import type { KpiData, AiInsight } from "../types";
import { AiInsightCard } from "./AiInsightCard";

/* ═══════════════════════════════════════════════════════════════
   S4: KPI — Compact mini-gauge grid
   ═══════════════════════════════════════════════════════════════ */

const META: Record<string, { color: string }> = {
    messages: { color: "#94a3b8" },
    has_phone: { color: "#3b82f6" },
    called: { color: "#8b5cf6" },
    appointed: { color: "#f59e0b" },
    arrived: { color: "#10b981" },
    signed: { color: "#ef4444" },
};

function MiniGauge({ pct, color, size = 44 }: { pct: number; color: string; size?: number }) {
    const r = (size - 5) / 2;
    const c = 2 * Math.PI * r;
    const arc = c * 0.75;
    const filled = arc * (Math.min(pct, 100) / 100);

    return (
        <svg width={size} height={size * 0.75} style={{ overflow: "visible" }}>
            <g transform={`translate(${size / 2}, ${size / 2})`}>
                <circle r={r} fill="none" stroke="var(--cc-border)" strokeWidth={3.5}
                    strokeDasharray={`${arc} ${c - arc}`} transform="rotate(135)" />
                <circle r={r} fill="none" stroke={color} strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeDasharray={`${filled} ${c - filled}`}
                    transform="rotate(135)"
                    className="transition-all duration-700"
                />
            </g>
        </svg>
    );
}

export function KpiSection({ data, aiInsight, loading }: {
    data: KpiData | null; aiInsight: AiInsight | null; loading: boolean;
}) {
    const metrics = data?.metrics ?? [];
    const empty = Array.from({ length: 6 }, (_, i) => ({
        metricKey: String(i), label: "–", actual: 0, target: 0, pct: 0, trend: "flat" as const,
    }));
    const items = metrics.length > 0 ? metrics : empty;

    return (
        <div className="cc-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--cc-text)", marginBottom: 12 }}>KPI Targets</h3>
            <div className="cc-grid-3" style={{ gap: 10 }}>
                {items.map((m) => {
                    const meta = META[m.metricKey] || { color: "#6366f1" };
                    const pctColor = m.pct >= 100 ? "#10b981" : m.pct >= 70 ? "#f59e0b" : "#ef4444";

                    return (
                        <div key={m.metricKey} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                            <div style={{ position: "relative" }}>
                                {loading ? (
                                    <div style={{ width: 44, height: 33, borderRadius: 22, background: "var(--cc-border)" }} className="animate-pulse" />
                                ) : (
                                    <MiniGauge pct={m.pct} color={meta.color} />
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--cc-text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                    {m.label}
                                </p>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: "var(--cc-text)" }}>{loading ? "–" : m.actual}</span>
                                    {m.target > 0 && (
                                        <span style={{ fontSize: 11, color: "var(--cc-text-faint)" }}>/{m.target}</span>
                                    )}
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: pctColor }}>{loading ? "" : `${m.pct}%`}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <AiInsightCard insight={aiInsight} />
        </div>
    );
}
