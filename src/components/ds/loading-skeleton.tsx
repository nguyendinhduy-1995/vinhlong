"use client";

import React from "react";

/* ═══════════════════════════════════════════════
   LoadingSkeleton — shimmer loading placeholders
   ═══════════════════════════════════════════════ */

function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-[var(--bg-inset)] ${className}`}
            style={style}
        />
    );
}

/** Card skeleton — glass card with shimmer lines */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="glass-2 rounded-2xl p-5 space-y-3 animate-fade-in-up">
            <Bone className="h-4 w-1/3" />
            {Array.from({ length: lines }).map((_, i) => (
                <Bone key={i} className="h-3" style={{ width: `${85 - i * 12}%` }} />
            ))}
        </div>
    );
}

/** Table skeleton — header + rows */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="glass-2 rounded-2xl p-4 space-y-2 animate-fade-in-up">
            {/* Header */}
            <div className="flex gap-3 pb-2 border-b border-[var(--border-hairline)]">
                {Array.from({ length: cols }).map((_, i) => (
                    <Bone key={i} className="h-3 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-3 py-2">
                    {Array.from({ length: cols }).map((_, c) => (
                        <Bone key={c} className="h-3 flex-1" style={{ opacity: 1 - r * 0.12 }} />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** Stat cards skeleton — grid of small metric cards */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 animate-fade-in-up">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="glass-2 rounded-2xl p-4 space-y-2">
                    <Bone className="h-3 w-1/2" />
                    <Bone className="h-6 w-2/3" />
                </div>
            ))}
        </div>
    );
}

/** Full page skeleton — header + stats + table */
export function PageSkeleton() {
    return (
        <div className="space-y-4">
            <CardSkeleton lines={1} />
            <StatsSkeleton />
            <TableSkeleton />
        </div>
    );
}
