"use client";

import React from "react";
import type { StaffData, AiInsight } from "../types";
import { AiInsightCard } from "./AiInsightCard";

/* ═══════════════════════════════════════════════════════════════
   S3: Staff — Leaderboard with stacked bars
   ═══════════════════════════════════════════════════════════════ */

type SummaryKey = "totalCalled" | "totalAppointed" | "totalArrived" | "totalSigned";

const SEGS = [
    { label: "Gọi", color: "#8b5cf6" },
    { label: "Hẹn", color: "#f59e0b" },
    { label: "Đến", color: "#10b981" },
    { label: "Ký", color: "#ef4444" },
];

export function StaffSection({ data, aiInsight, loading }: {
    data: StaffData | null; aiInsight: AiInsight | null; loading: boolean;
}) {
    const rows = data?.rows ?? [];
    const maxTotal = Math.max(...rows.map(r => r.called + r.appointed + r.arrived + r.signed), 1);

    return (
        <div className="cc-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="flex items-center justify-between">
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--cc-text)" }}>Nhân sự</h3>
                <div className="flex gap-3">
                    {SEGS.map((s) => (
                        <span key={s.label} className="flex items-center gap-1" style={{ fontSize: 10, color: "var(--cc-text-faint)" }}>
                            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: s.color }} />
                            {s.label}
                        </span>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <div style={{ width: 80, height: 14, borderRadius: 4, background: "var(--cc-border)" }} className="animate-pulse" />
                            <div className="flex-1" style={{ height: 20, borderRadius: 4, background: "var(--cc-border)" }} />
                        </div>
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--cc-text-faint)", padding: 12 }}>Chưa có dữ liệu nhân sự</p>
            ) : (
                <div className="space-y-2">
                    {rows.slice(0, 8).map((row) => {
                        const total = row.called + row.appointed + row.arrived + row.signed;
                        const barPct = (total / maxTotal) * 100;
                        const pending = row.pendingCall + row.pendingAppt + row.pendingArrival + row.pendingSign;

                        return (
                            <div key={row.userId} className="flex items-center gap-3">
                                {/* Name */}
                                <div style={{ width: 90, flexShrink: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--cc-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {row.name}
                                    </p>
                                </div>

                                {/* Stacked bar */}
                                <div className="flex-1" style={{ height: 20, borderRadius: 4, background: "var(--cc-border)", overflow: "hidden", display: "flex" }}>
                                    {[
                                        { val: row.called, color: "#8b5cf6" },
                                        { val: row.appointed, color: "#f59e0b" },
                                        { val: row.arrived, color: "#10b981" },
                                        { val: row.signed, color: "#ef4444" },
                                    ].map((seg, si) => (
                                        seg.val > 0 ? (
                                            <div
                                                key={si}
                                                style={{
                                                    width: `${(seg.val / maxTotal) * 100}%`,
                                                    background: seg.color,
                                                    height: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    transition: "width 0.7s ease",
                                                }}
                                            >
                                                {barPct > 20 && (
                                                    <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>{seg.val}</span>
                                                )}
                                            </div>
                                        ) : null
                                    ))}
                                </div>

                                {/* Total */}
                                <span style={{ width: 24, fontSize: 12, fontWeight: 700, color: "var(--cc-text)", textAlign: "right" }}>
                                    {total}
                                </span>

                                {/* Pending */}
                                {pending > 0 && (
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, color: "#ef4444",
                                        background: "rgba(239,68,68,0.15)", borderRadius: 10,
                                        padding: "1px 6px",
                                    }}>
                                        {pending}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            <AiInsightCard insight={aiInsight} />
        </div>
    );
}
