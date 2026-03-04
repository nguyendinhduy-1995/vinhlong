"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_MENU, type AdminMenuItem } from "@/lib/admin-menu";

/* ── Helpers ── */
function normalize(str: string) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

function matchItem(item: AdminMenuItem, query: string): boolean {
    const q = normalize(query);
    if (normalize(item.label).includes(q)) return true;
    if (normalize(item.group).includes(q)) return true;
    if (item.href.toLowerCase().includes(q)) return true;
    return item.keywords?.some((kw) => normalize(kw).includes(q)) ?? false;
}

/* ── Component ── */
export function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    /* Filter items */
    const filtered = query.trim()
        ? ADMIN_MENU.filter((item) => matchItem(item, query.trim()))
        : ADMIN_MENU;

    /* Group results */
    const grouped = filtered.reduce<Record<string, AdminMenuItem[]>>((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {});

    const flatItems = Object.values(grouped).flat();

    /* Keyboard shortcuts ── Cmd+K / Ctrl+K */
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    /* Focus input when opening */
    useEffect(() => {
        if (open) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    /* Scroll selected into view */
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
        el?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    const navigate = useCallback(
        (href: string) => {
            setOpen(false);
            router.push(href);
        },
        [router]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
                e.preventDefault();
                const item = flatItems[selectedIndex];
                if (item) navigate(item.href);
            }
        },
        [flatItems, navigate, selectedIndex]
    );

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] p-4" onClick={() => setOpen(false)}>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative w-full max-w-lg glass-4 rounded-2xl shadow-[var(--shadow-xl)] animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-hairline)]">
                    <span className="text-[color:var(--fg-muted)] text-sm">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tìm trang, tính năng..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent text-sm text-[color:var(--fg)] outline-none placeholder:text-[color:var(--fg-faint)]"
                    />
                    <kbd className="hidden md:inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--fg-muted)]">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
                    {flatItems.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-[color:var(--fg-muted)]">
                            Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
                        </div>
                    ) : (
                        Object.entries(grouped).map(([group, items]) => (
                            <div key={group}>
                                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--fg-muted)]">
                                    {group}
                                </p>
                                {items.map((item) => {
                                    const idx = flatItems.indexOf(item);
                                    const isSelected = idx === selectedIndex;
                                    return (
                                        <button
                                            key={item.key}
                                            data-index={idx}
                                            type="button"
                                            onClick={() => navigate(item.href)}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected
                                                    ? "bg-[var(--accent-bg)] text-[color:var(--accent)]"
                                                    : "text-[color:var(--fg)] hover:bg-[var(--hover)]"
                                                }`}
                                        >
                                            <span className="text-base w-6 text-center flex-shrink-0">{item.icon}</span>
                                            <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                                            {isSelected && (
                                                <span className="text-[10px] text-[color:var(--fg-muted)]">↵</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hint */}
                <div className="border-t border-[var(--border-hairline)] px-4 py-2 flex items-center gap-4 text-[10px] text-[color:var(--fg-faint)]">
                    <span>↑↓ Di chuyển</span>
                    <span>↵ Mở trang</span>
                    <span>ESC Đóng</span>
                </div>
            </div>
        </div>
    );
}
