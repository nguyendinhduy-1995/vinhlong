"use client";

import React from "react";
import type { AnalyticsData, AiInsight } from "../types";
import { AiInsightCard } from "./AiInsightCard";

/* ═══════════════════════════════════════════════════════════════
   S5: Analytics — Compact dark stat row
   ═══════════════════════════════════════════════════════════════ */

const STATS = [
    { key: "online" as const, label: "Online", color: "#10b981" },
    { key: "users" as const, label: "Users", color: "#3b82f6" },
    { key: "pageviews" as const, label: "Views", color: "#8b5cf6" },
    { key: "sessions" as const, label: "Sessions", color: "#f59e0b" },
    { key: "avgDuration" as const, label: "Avg Time", color: "#ec4899", suffix: "s" },
];

export function AnalyticsSection({ data, aiInsight, loading }: {
    data: AnalyticsData | null; aiInsight: AiInsight | null; loading: boolean;
}) {
    return (
        <div className="cc-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--cc-text)", marginBottom: 12 }}>Analytics</h3>
            <div style={{ display: "flex", gap: 0 }}>
                {STATS.map((s, i) => {
                    const val = data?.[s.key] ?? 0;
                    return (
                        <div
                            key={s.key}
                            style={{
                                flex: 1,
                                textAlign: "center",
                                borderLeft: i > 0 ? "1px solid var(--cc-border)" : "none",
                                padding: "4px 8px",
                            }}
                        >
                            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--cc-text-faint)", textTransform: "uppercase" }}>
                                {s.label}
                            </p>
                            {loading ? (
                                <div style={{ height: 22, width: 28, borderRadius: 4, background: "var(--cc-border)", margin: "6px auto 0" }} className="animate-pulse" />
                            ) : (
                                <p style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4 }}>
                                    {val}{s.suffix || ""}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
            {data && data.online === 0 && data.users === 0 && (
                <p style={{ fontSize: 10, color: "var(--cc-text-faint)", marginTop: 8 }}>
                    Cần tích hợp GA4 hoặc tracking nội bộ
                </p>
            )}
            <AiInsightCard insight={aiInsight} />
        </div>
    );
}
