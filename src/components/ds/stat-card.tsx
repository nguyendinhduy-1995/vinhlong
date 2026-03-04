"use client";

import type { ReactNode } from "react";

type StatCardProps = {
    label: string;
    value: string | number;
    /** Subtitle or comparison text */
    subtitle?: string;
    /** Accent color for value */
    accent?: boolean;
    /** Optional icon */
    icon?: ReactNode;
};

export function StatCard({ label, value, subtitle, accent = false, icon }: StatCardProps) {
    return (
        <div className="glass-2 p-4" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p
                        className="truncate font-medium uppercase tracking-wide"
                        style={{ fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)', letterSpacing: 'var(--tracking-wide)' }}
                    >
                        {label}
                    </p>
                    <p
                        className="mt-1 truncate font-bold"
                        style={{
                            fontSize: 'var(--text-2xl)',
                            lineHeight: 'var(--leading-tight)',
                            color: accent ? 'var(--accent)' : 'var(--fg)',
                            letterSpacing: 'var(--tracking-tight)',
                        }}
                    >
                        {value}
                    </p>
                    {subtitle ? (
                        <p className="mt-0.5 truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                {icon ? (
                    <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: 'var(--bg-inset)', color: 'var(--fg-muted)' }}
                    >
                        {icon}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
