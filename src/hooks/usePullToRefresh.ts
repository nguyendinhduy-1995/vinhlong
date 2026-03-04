"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Pull-to-refresh hook for mobile lists.
 * Returns { pullRef, pulling, pullProgress, onTouchStart, onTouchMove, onTouchEnd }
 * Attach pullRef to the container, and touch events to it.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
    const [pulling, setPulling] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const startY = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
        } else {
            startY.current = 0;
        }
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!startY.current) return;
        const delta = e.touches[0].clientY - startY.current;
        if (delta > 0 && delta < 120) {
            setPullProgress(Math.min(delta / 80, 1));
        }
    }, []);

    const onTouchEnd = useCallback(async () => {
        if (pullProgress >= 1) {
            setPulling(true);
            try {
                await onRefresh();
            } finally {
                setPulling(false);
            }
        }
        setPullProgress(0);
        startY.current = 0;
    }, [pullProgress, onRefresh]);

    return {
        pullRef: containerRef,
        pulling,
        pullProgress,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
    };
}
