"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="glass-2 flex flex-col items-center justify-center px-6 py-12 text-center" style={{ borderRadius: 'var(--radius-lg)' }}>
            {icon ? (
                <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: 'var(--bg-inset)', color: 'var(--fg-muted)' }}
                >
                    {icon}
                </div>
            ) : null}
            <h3 className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--fg)' }}>
                {title}
            </h3>
            {description ? (
                <p className="mt-1 max-w-sm" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-muted)' }}>
                    {description}
                </p>
            ) : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}

type ErrorStateProps = {
    message: string;
    onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <div className="glass-2 flex flex-col items-center justify-center px-6 py-12 text-center" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
                !
            </div>
            <h3 className="font-semibold" style={{ fontSize: 'var(--text-base)', color: 'var(--fg)' }}>
                Đã xảy ra lỗi
            </h3>
            <p className="mt-1 max-w-sm" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-muted)' }}>
                {message}
            </p>
            {onRetry ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 px-4 py-2 font-semibold transition-all"
                    style={{
                        borderRadius: 'var(--radius)',
                        fontSize: 'var(--text-sm)',
                        background: 'var(--accent)',
                        color: '#fff',
                    }}
                >
                    Thử lại
                </button>
            ) : null}
        </div>
    );
}

type LoadingSkeletonProps = {
    lines?: number;
    className?: string;
};

export function LoadingSkeleton({ lines = 3, className = "" }: LoadingSkeletonProps) {
    return (
        <div className={`animate-pulse space-y-3 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3"
                    style={{
                        borderRadius: 'var(--radius)',
                        background: 'var(--bg-elevated)',
                        border: '0.5px solid var(--border-hairline)',
                    }}
                >
                    <div className="h-9 w-9 rounded-lg" style={{ background: 'var(--bg-inset)' }} />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 rounded" style={{ background: 'var(--bg-inset)' }} />
                        <div className="h-3 w-2/3 rounded" style={{ background: 'var(--border-hairline)' }} />
                    </div>
                    <div className="h-6 w-16 rounded-full" style={{ background: 'var(--bg-inset)' }} />
                </div>
            ))}
        </div>
    );
}
