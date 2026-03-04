"use client";

import React from "react";
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
    PieChart, Pie, Cell,
    AreaChart, Area,
} from "recharts";

/* ── Color palette matching admin tokens ── */
const COLORS = [
    "var(--accent, #007aff)",
    "#34c759",
    "#ff9500",
    "#af52de",
    "#ff3b30",
    "#5ac8fa",
    "#ff2d55",
    "#ffcc00",
];

const tooltipStyle = {
    backgroundColor: "var(--bg-elevated, #fff)",
    border: "1px solid var(--border-subtle, #e5e7eb)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--fg, #1d1d1f)",
};

/* ═════════════════════════════════════════════
   1. Mini Bar Chart (for KPI comparison)
   ═════════════════════════════════════════════ */
type BarItem = { label: string; value: number };

export function MiniBarChart({
    data,
    height = 160,
    color = "var(--accent, #007aff)",
}: {
    data: BarItem[];
    height?: number;
    color?: string;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
        </ResponsiveContainer>
    );
}

/* ═════════════════════════════════════════════
   2. Donut Chart (for status distribution)
   ═════════════════════════════════════════════ */
type DonutItem = { name: string; value: number; color?: string };

export function DonutChart({
    data,
    size = 120,
    innerRadius = 35,
    outerRadius = 52,
}: {
    data: DonutItem[];
    size?: number;
    innerRadius?: number;
    outerRadius?: number;
}) {
    const filtered = data.filter((d) => d.value > 0);
    if (filtered.length === 0) {
        return (
            <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                <span className="text-xs text-[color:var(--fg-muted)]">─</span>
            </div>
        );
    }
    return (
        <PieChart width={size} height={size}>
            <Pie data={filtered} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} dataKey="value" strokeWidth={0}>
                {filtered.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
    );
}

/* ═════════════════════════════════════════════
   3. Sparkline (mini area chart — no axis)
   ═════════════════════════════════════════════ */
type SparkPoint = { value: number };

export function Sparkline({
    data,
    width = 100,
    height = 32,
    color = "var(--accent, #007aff)",
}: {
    data: SparkPoint[];
    width?: number;
    height?: number;
    color?: string;
}) {
    if (data.length < 2) return null;
    return (
        <ResponsiveContainer width={width} height={height}>
            <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                <defs>
                    <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color})`} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

/* ═════════════════════════════════════════════
   4. Funnel (horizontal for pipeline)
   ═════════════════════════════════════════════ */
type FunnelItem = { label: string; value: number; color: string };

export function FunnelBar({
    data,
}: {
    data: FunnelItem[];
}) {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div className="space-y-1.5">
            {data.map((item) => {
                const pct = Math.max((item.value / max) * 100, 4);
                return (
                    <div key={item.label} className="flex items-center gap-2">
                        <span className="w-20 text-[11px] font-medium text-[color:var(--fg-secondary)] truncate">{item.label}</span>
                        <div className="flex-1 h-5 rounded-full bg-[var(--bg-inset)] overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                            />
                        </div>
                        <span className="w-8 text-right text-[11px] font-bold text-[color:var(--fg)]">{item.value}</span>
                    </div>
                );
            })}
        </div>
    );
}
