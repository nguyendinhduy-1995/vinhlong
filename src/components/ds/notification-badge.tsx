"use client";

import React from "react";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";

/**
 * Notification badge for the topbar — polls every 60s.
 * Shows red dot + count when there are pending notifications.
 */
export function NotificationBadge({ onClick }: { onClick?: () => void }) {
    const { total, loading } = useNotificationBadge();

    return (
        <button
            type="button"
            onClick={onClick}
            className="relative inline-flex items-center justify-center rounded-xl p-2 text-[color:var(--fg-muted)] transition-colors hover:bg-[var(--hover)] hover:text-[color:var(--fg)]"
            title={`${total} thông báo chưa xử lý`}
        >
            <span className="text-base">🔔</span>
            {!loading && total > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white shadow-sm animate-scale-in">
                    {total > 99 ? "99+" : total}
                </span>
            )}
        </button>
    );
}
