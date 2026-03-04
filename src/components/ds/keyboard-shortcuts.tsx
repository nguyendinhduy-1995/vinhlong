"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
    { keys: ["⌘", "K"], label: "Tìm kiếm / mở trang nhanh" },
    { keys: ["⌘", "?"], label: "Hiện phím tắt (dialog này)" },
    { keys: ["↑", "↓"], label: "Di chuyển trong danh sách" },
    { keys: ["↵"], label: "Chọn / mở mục đang chọn" },
    { keys: ["Esc"], label: "Đóng dialog / modal" },
];

export function KeyboardShortcutsDialog() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === "/") {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-sm glass-4 rounded-2xl shadow-[var(--shadow-xl)] animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-4 border-b border-[var(--border-hairline)]">
                    <h2 className="text-base font-bold text-[color:var(--fg)]">⌨️ Phím tắt</h2>
                    <p className="text-[11px] text-[color:var(--fg-muted)] mt-0.5">Truy cập nhanh các tính năng</p>
                </div>
                <div className="px-5 py-3 space-y-2.5">
                    {SHORTCUTS.map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-[color:var(--fg)]">{s.label}</span>
                            <div className="flex items-center gap-1">
                                {s.keys.map((k, j) => (
                                    <kbd
                                        key={j}
                                        className="inline-flex min-w-[28px] items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-1.5 py-1 text-[11px] font-mono font-semibold text-[color:var(--fg-secondary)]"
                                    >
                                        {k}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-t border-[var(--border-hairline)] px-5 py-2.5 text-[10px] text-[color:var(--fg-faint)]">
                    Bấm Esc hoặc ⌘/ để đóng
                </div>
            </div>
        </div>
    );
}
