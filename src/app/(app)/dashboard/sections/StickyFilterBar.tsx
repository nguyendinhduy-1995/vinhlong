"use client";

import React from "react";
import type { DateRange } from "../types";

/* ═══════════════════════════════════════════════════════════════
   StickyFilterBar — Dark command center style
   ═══════════════════════════════════════════════════════════════ */

interface Branch { id: string; name: string; }
interface Owner { id: string; name: string; }

interface Props {
    branches: Branch[];
    owners: Owner[];
    branchId: string;
    ownerId: string;
    channel: string;
    range: DateRange;
    lastSync: string;
    onBranchChange: (v: string) => void;
    onOwnerChange: (v: string) => void;
    onChannelChange: (v: string) => void;
    onRangeChange: (v: DateRange) => void;
    onRefresh: () => void;
    loading: boolean;
}

const RANGE_OPTS: { value: DateRange; label: string }[] = [
    { value: "today", label: "Hôm nay" },
    { value: "yesterday", label: "Hôm qua" },
    { value: "7d", label: "7 ngày" },
    { value: "mtd", label: "Tháng" },
];

function timeSince(iso: string) {
    if (!iso) return "";
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "vừa xong";
    if (diff < 60) return `${diff}p trước`;
    return `${Math.floor(diff / 60)}h${diff % 60}p`;
}

export function StickyFilterBar(props: Props) {
    const selStyle: React.CSSProperties = {
        background: "var(--cc-surface)",
        color: "var(--cc-text)",
        border: "1px solid var(--cc-border)",
        borderRadius: 8,
        height: 34,
        padding: "0 10px",
        fontSize: 12,
        fontWeight: 600,
    };

    return (
        <div className="sticky top-[60px] z-30" style={{ background: "var(--cc-bg)", paddingBottom: 4 }}>
            <div className="cc-card" style={{ padding: "10px 14px" }}>
                <div className="flex flex-wrap items-center gap-2">
                    <select value={props.branchId} onChange={(e) => props.onBranchChange(e.target.value)} style={selStyle}>
                        <option value="">Tất cả chi nhánh</option>
                        {props.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <select value={props.ownerId} onChange={(e) => props.onOwnerChange(e.target.value)} style={selStyle}>
                        <option value="">Tất cả nhân sự</option>
                        {props.owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>

                    <select value={props.channel} onChange={(e) => props.onChannelChange(e.target.value)} style={selStyle}>
                        <option value="">Tất cả kênh</option>
                        <option value="page">Facebook</option>
                        <option value="landing">Landing</option>
                    </select>

                    <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--cc-border)" }}>
                        {RANGE_OPTS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => props.onRangeChange(opt.value)}
                                className="px-3 py-1.5 text-xs font-bold transition-colors"
                                style={
                                    props.range === opt.value
                                        ? { background: "var(--cc-blue)", color: "#fff" }
                                        : { background: "transparent", color: "var(--cc-text-dim)" }
                                }
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    {/* Sync */}
                    <span style={{ fontSize: 11, color: "var(--cc-text-faint)" }} className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "var(--cc-emerald)" }} />
                            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--cc-emerald)" }} />
                        </span>
                        {timeSince(props.lastSync)}
                    </span>

                    <button
                        onClick={props.onRefresh}
                        disabled={props.loading}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors"
                        style={{ background: props.loading ? "var(--cc-border)" : "var(--cc-blue)", color: "#fff" }}
                    >
                        <span className={props.loading ? "animate-spin" : ""}>⟳</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
