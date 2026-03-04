"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson } from "@/lib/api-client";
import { getToken } from "@/lib/auth-client";

type NotificationBadgeData = {
    newCount: number;
    doingCount: number;
    total: number;
};

/**
 * Polls /api/notifications for unread count every `intervalMs` (default 60s).
 * Returns { count, loading } — use count for topbar badge.
 */
export function useNotificationBadge(intervalMs = 60_000) {
    const [data, setData] = useState<NotificationBadgeData>({ newCount: 0, doingCount: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const poll = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const [newRes, doingRes] = await Promise.all([
                fetchJson<{ total: number }>("/api/notifications?status=NEW&page=1&pageSize=1", { token }),
                fetchJson<{ total: number }>("/api/notifications?status=DOING&page=1&pageSize=1", { token }),
            ]);
            setData({
                newCount: newRes.total,
                doingCount: doingRes.total,
                total: newRes.total + doingRes.total,
            });
        } catch {
            // silently fail — badge just won't update
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        poll();
        timerRef.current = setInterval(poll, intervalMs);
        return () => clearInterval(timerRef.current);
    }, [poll, intervalMs]);

    return { ...data, loading, refresh: poll };
}
