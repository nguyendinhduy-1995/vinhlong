"use client";

import React from "react";
import type { FinanceData, AiInsight } from "../types";
import { AiInsightCard } from "./AiInsightCard";

/* ═══════════════════════════════════════════════════════════════
   S1: Finance — Dark metric cards with left accent border
   ═══════════════════════════════════════════════════════════════ */

function fmtCurrency(v: number) {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return String(v);
}

const CARDS = [
    { key: "signedToday" as const, label: "Hồ sơ đã ký", color: "var(--cc-blue)" },
    { key: "totalThuToday" as const, label: "Tổng tiền thu", color: "var(--cc-emerald)", format: true },
    { key: "countPaid50" as const, label: "Đóng ≥50% học phí", color: "var(--cc-amber)" },
];

export function FinanceSection({ data, aiInsight, loading }: {
    data: FinanceData | null; aiInsight: AiInsight | null; loading: boolean;
}) {
    return (
        <>
            <div className="cc-grid-3">
                {CARDS.map((card) => {
                    const val = data?.[card.key] ?? 0;
                    return (
                        <div
                            key={card.key}
                            className="cc-card"
                            style={{ padding: "16px 20px", borderLeft: `3px solid ${card.color}` }}
                        >
                            <p className="cc-label">{card.label}</p>
                            {loading ? (
                                <div style={{ height: 32, width: 60, borderRadius: 6, background: "var(--cc-border)", marginTop: 8 }} className="animate-pulse" />
                            ) : (
                                <>
                                    <p className="cc-value" style={{ marginTop: 6, color: card.color }}>
                                        {card.format ? fmtCurrency(val) : val}
                                    </p>
                                    {card.format && val > 0 && (
                                        <p style={{ fontSize: 11, color: "var(--cc-text-faint)", marginTop: 4 }}>
                                            {val.toLocaleString("vi-VN")} ₫
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            <AiInsightCard insight={aiInsight} />
        </>
    );
}
