"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/* ── Types ── */
export type MetricStatus = "NEW" | "HAS_PHONE" | "APPOINTED" | "ARRIVED" | "SIGNED" | "LOST";

export const LEAD_STATUS_STYLE: Record<MetricStatus, { icon: string; bg: string; text: string }> = {
    NEW: { icon: "", bg: "var(--accent-bg)", text: "text-[color:var(--accent)]" },
    HAS_PHONE: { icon: "", bg: "var(--info-bg)", text: "text-[color:var(--info)]" },
    APPOINTED: { icon: "", bg: "rgba(175,82,222,0.08)", text: "text-[color:var(--accent)]" },
    ARRIVED: { icon: "", bg: "var(--warning-bg)", text: "text-[color:var(--warning)]" },
    SIGNED: { icon: "", bg: "var(--success-bg)", text: "text-[color:var(--success)]" },
    LOST: { icon: "", bg: "var(--danger-bg)", text: "text-[color:var(--danger)]" },
};

/* ── MiniMetricCard ── */
export function MiniMetricCard({ status, label, count, onClick, delay }: {
    status: MetricStatus; label: string; count: number; onClick: () => void; delay: string;
}) {
    const style = LEAD_STATUS_STYLE[status];
    return (
        <button
            type="button"
            onClick={onClick}
            className={`animate-spring-in ${delay} glass-2 tap-feedback rounded-2xl p-4 text-left`}
        >
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--fg-muted)' }}>{label}</p>
            <p className={`text-[28px] font-bold tracking-tight leading-none ${style.text}`}>{count}</p>
        </button>
    );
}

/* ── KpiGauge ── */
export function KpiGauge({ label, value, color }: { label: string; value: number; color: string }) {
    const pct = Math.min(100, Math.max(0, value));
    return (
        <div className="glass-2 rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--fg-muted)' }}>{label}</p>
            <p className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--fg)' }}>{value.toFixed(1)}%</p>
            <div className="mt-2.5 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

/* ── FinanceStat ── */
export function FinanceStat({ label, value }: { label: string; value: string; icon?: string }) {
    return (
        <div className="glass-2 rounded-2xl p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--fg-muted)' }}>{label}</p>
            <p className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--fg)' }}>{value}</p>
        </div>
    );
}

/* ── SectionHeader ── */
export function SectionHeader({ title, badge, action }: {
    icon?: string; gradient?: string; title: string; badge?: React.ReactNode; action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{title}</h2>
            <div className="flex items-center gap-2">
                {badge}
                {action}
            </div>
        </div>
    );
}

/* ── DashboardSkeleton ── */
export function DashboardSkeleton() {
    return (
        <div className="grid gap-4 lg:grid-cols-2 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-2 rounded-2xl p-5">
                    <Skeleton className="mb-4 h-4 w-24" />
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="rounded-xl p-3.5" style={{ background: 'var(--bg-inset)' }}>
                                <Skeleton className="mb-1.5 h-3 w-14" />
                                <Skeleton className="h-7 w-12" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
