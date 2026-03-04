"use client";

import React from "react";
import type { FunnelData, AiInsight } from "../types";
import { AiInsightCard } from "./AiInsightCard";

/* ═══════════════════════════════════════════════════════════════
   S2: Funnel — Proper trapezoid funnel visualization
   ═══════════════════════════════════════════════════════════════ */

const STAGES = [
    { key: "messages" as const, label: "Tin nhắn", color: "#94a3b8" },
    { key: "hasPhoneTotal" as const, label: "Có SĐT", color: "#3b82f6" },
    { key: "called" as const, label: "Đã gọi", color: "#8b5cf6" },
    { key: "appointed" as const, label: "Đã hẹn", color: "#f59e0b" },
    { key: "arrived" as const, label: "Đã đến", color: "#10b981" },
    { key: "signed" as const, label: "Đã ký", color: "#ef4444" },
];

const RATIO_KEYS: Array<keyof FunnelData["ratios"]> = [
    "hasPhonePerMsg", "calledPerHasPhone", "appointedPerCalled", "arrivedPerAppointed", "signedPerArrived"
];

export function FunnelSection({ data, aiInsight, loading }: {
    data: FunnelData | null; aiInsight: AiInsight | null; loading: boolean;
}) {
    const values = STAGES.map((s) => (data?.[s.key] as number) ?? 0);
    const maxVal = Math.max(...values, 1);
    const totalConv = values[0] > 0 ? ((values[5] / values[0]) * 100).toFixed(1) : "0";

    return (
        <div className="cc-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="flex items-center justify-between">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--cc-text)" }}>Phễu chuyển đổi</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cc-emerald)" }}>{totalConv}%</span>
            </div>

            {/* SVG Trapezoid Funnel */}
            <svg viewBox="0 0 400 300" className="w-full" style={{ maxHeight: 280 }}>
                {STAGES.map((stage, i) => {
                    const pct = maxVal > 0 ? values[i] / maxVal : 0;
                    // Minimum width 15%, max 100%
                    const widthPct = Math.max(pct, 0.15);
                    const topY = i * 48 + 4;
                    const h = 40;
                    // Current and next widths for trapezoid shape
                    const nextPct = i < 5 ? Math.max((values[i + 1] ?? 0) / maxVal, 0.15) : widthPct * 0.85;

                    const topW = widthPct * 340;
                    const botW = nextPct * 340;
                    const topX = (400 - topW) / 2;
                    const botX = (400 - botW) / 2;

                    // Trapezoid points
                    const points = `${topX},${topY} ${topX + topW},${topY} ${botX + botW},${topY + h} ${botX},${topY + h}`;

                    return (
                        <g key={stage.key}>
                            <polygon
                                points={points}
                                fill={stage.color}
                                opacity={loading ? 0.2 : 0.85}
                                className="transition-all duration-700"
                            />
                            {/* Label + value */}
                            {!loading && (
                                <text
                                    x={200} y={topY + h / 2 + 5}
                                    textAnchor="middle" fill="white"
                                    fontSize="13" fontWeight="800"
                                >
                                    {stage.label}: {values[i]}
                                </text>
                            )}
                            {/* Conversion ratio on the right */}
                            {i > 0 && data?.ratios && (
                                <text
                                    x={390} y={topY + h / 2 + 4}
                                    textAnchor="end"
                                    fontSize="10" fontWeight="700"
                                    fill={
                                        (data.ratios[RATIO_KEYS[i - 1]] ?? 0) >= 50 ? "#10b981" :
                                            (data.ratios[RATIO_KEYS[i - 1]] ?? 0) >= 25 ? "#f59e0b" : "#ef4444"
                                    }
                                >
                                    {data.ratios[RATIO_KEYS[i - 1]]}%
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Source */}
            {data && (data.hasPhonePage > 0 || data.hasPhoneLanding > 0) && (
                <div className="flex gap-4" style={{ fontSize: 11, color: "var(--cc-text-faint)" }}>
                    <span>Page: <strong style={{ color: "var(--cc-text)" }}>{data.hasPhonePage}</strong></span>
                    <span>Landing: <strong style={{ color: "var(--cc-text)" }}>{data.hasPhoneLanding}</strong></span>
                </div>
            )}
            <AiInsightCard insight={aiInsight} />
        </div>
    );
}
