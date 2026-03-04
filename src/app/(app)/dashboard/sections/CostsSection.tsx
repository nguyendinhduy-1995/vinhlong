"use client";

import React from "react";
import type { CostsData, AiInsight } from "../types";
import { AiInsightCard } from "./AiInsightCard";

/* ═══════════════════════════════════════════════════════════════
   S6: Costs — Stacked bar + Revenue vs Cost comparison
   ═══════════════════════════════════════════════════════════════ */

function fmtVnd(v: number) {
    const abs = Math.abs(v);
    const sign = v < 0 ? "-" : "";
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K`;
    return String(v);
}

const SEGMENTS = [
    { key: "marketing" as const, label: "Marketing", color: "#8b5cf6" },
    { key: "payroll" as const, label: "Lương", color: "#3b82f6" },
    { key: "fixed" as const, label: "Cố định", color: "#64748b" },
];

export function CostsSection({ data, aiInsight, loading }: {
    data: CostsData | null; aiInsight: AiInsight | null; loading: boolean;
}) {
    const total = data?.total ?? 0;
    const revenue = data?.revenue ?? 0;
    const profit = data?.profit ?? 0;
    const isPositive = profit >= 0;
    const maxBar = Math.max(total, revenue, 1);

    return (
        <div className="cc-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--cc-text)" }}>Chi phí & Lợi nhuận</h3>

            {/* Cost breakdown stacked bar */}
            <div>
                <p className="cc-label" style={{ marginBottom: 6 }}>Chi phí</p>
                {loading ? (
                    <div style={{ height: 24, borderRadius: 6, background: "var(--cc-border)" }} className="animate-pulse" />
                ) : (
                    <>
                        <div style={{ height: 24, borderRadius: 6, background: "var(--cc-border)", overflow: "hidden", display: "flex" }}>
                            {SEGMENTS.map((seg) => {
                                const val = data?.[seg.key] ?? 0;
                                const pct = total > 0 ? (val / total) * 100 : 0;
                                return pct > 0 ? (
                                    <div
                                        key={seg.key}
                                        style={{
                                            width: `${pct}%`,
                                            background: seg.color,
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "width 0.7s ease",
                                        }}
                                    >
                                        {pct > 15 && (
                                            <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>{fmtVnd(val)}</span>
                                        )}
                                    </div>
                                ) : null;
                            })}
                        </div>
                        {/* Legend */}
                        <div className="flex gap-4" style={{ marginTop: 6 }}>
                            {SEGMENTS.map((seg) => (
                                <span key={seg.key} className="flex items-center gap-1" style={{ fontSize: 10, color: "var(--cc-text-faint)" }}>
                                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: seg.color }} />
                                    {seg.label}: <strong style={{ color: "var(--cc-text)" }}>{fmtVnd(data?.[seg.key] ?? 0)}</strong>
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Revenue vs Cost comparison */}
            <div>
                <p className="cc-label" style={{ marginBottom: 6 }}>Thu vs Chi</p>
                {loading ? (
                    <div className="space-y-2">
                        <div style={{ height: 18, borderRadius: 4, background: "var(--cc-border)", width: "60%" }} className="animate-pulse" />
                        <div style={{ height: 18, borderRadius: 4, background: "var(--cc-border)", width: "80%" }} className="animate-pulse" />
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {/* Revenue bar */}
                        <div className="flex items-center gap-2">
                            <span style={{ fontSize: 10, width: 28, color: "var(--cc-text-faint)", fontWeight: 600 }}>Thu</span>
                            <div className="flex-1" style={{ height: 18, borderRadius: 4, background: "var(--cc-border)" }}>
                                <div style={{
                                    width: `${maxBar > 0 ? (revenue / maxBar) * 100 : 0}%`,
                                    height: "100%",
                                    borderRadius: 4,
                                    background: "#10b981",
                                    transition: "width 0.7s ease",
                                    minWidth: revenue > 0 ? 20 : 0,
                                }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", width: 50, textAlign: "right" }}>{fmtVnd(revenue)}</span>
                        </div>
                        {/* Cost bar */}
                        <div className="flex items-center gap-2">
                            <span style={{ fontSize: 10, width: 28, color: "var(--cc-text-faint)", fontWeight: 600 }}>Chi</span>
                            <div className="flex-1" style={{ height: 18, borderRadius: 4, background: "var(--cc-border)" }}>
                                <div style={{
                                    width: `${maxBar > 0 ? (total / maxBar) * 100 : 0}%`,
                                    height: "100%",
                                    borderRadius: 4,
                                    background: "#ef4444",
                                    transition: "width 0.7s ease",
                                    minWidth: total > 0 ? 20 : 0,
                                }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", width: 50, textAlign: "right" }}>{fmtVnd(total)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Profit */}
            <div style={{
                borderTop: "1px solid var(--cc-border)",
                paddingTop: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cc-text-dim)" }}>Lợi nhuận ước tính</span>
                {loading ? (
                    <div style={{ height: 28, width: 60, borderRadius: 6, background: "var(--cc-border)" }} className="animate-pulse" />
                ) : (
                    <span style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: isPositive ? "#10b981" : "#ef4444",
                    }}>
                        {isPositive ? "+" : ""}{fmtVnd(profit)}
                    </span>
                )}
            </div>

            <AiInsightCard insight={aiInsight} />
        </div>
    );
}
