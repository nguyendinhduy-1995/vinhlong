"use client";

import React, { useCallback, useEffect, useRef } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: "danger" | "warning" | "neutral";
    loading?: boolean;
};

const TONE_BTN: Record<string, string> = {
    danger: "bg-[var(--danger)] hover:bg-[var(--danger-fg)] text-white",
    warning: "bg-[var(--warning)] hover:bg-[var(--warning-fg)] text-white",
    neutral: "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
};

export function ConfirmDialog({
    open, onClose, onConfirm,
    title = "Xác nhận",
    message,
    confirmLabel = "Xác nhận",
    cancelLabel = "Huỷ",
    tone = "danger",
    loading = false,
}: Props) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    const handleKey = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (open) {
            document.addEventListener("keydown", handleKey);
            confirmRef.current?.focus();
            return () => document.removeEventListener("keydown", handleKey);
        }
    }, [open, handleKey]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative glass-4 rounded-2xl p-6 w-full max-w-sm animate-scale-in shadow-[var(--shadow-xl)]"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-[color:var(--fg)] mb-2">{title}</h3>
                <p className="text-sm text-[color:var(--fg-secondary)] mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="h-9 rounded-xl px-4 text-sm font-medium text-[color:var(--fg-secondary)] hover:bg-[var(--hover)] transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        onClick={onConfirm}
                        disabled={loading}
                        className={`h-9 rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${TONE_BTN[tone]}`}
                    >
                        {loading ? "Đang xử lý..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
