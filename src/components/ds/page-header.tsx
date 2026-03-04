"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
    title: string;
    subtitle?: string;
    /** Breadcrumb items */
    breadcrumb?: Array<{ label: string; href?: string }>;
    /** Primary actions (e.g. Create, Export buttons) */
    actions?: ReactNode;
    /** Secondary actions row (e.g. filter chips) */
    secondaryActions?: ReactNode;
};

export function PageHeader({
    title,
    subtitle,
    breadcrumb,
    actions,
    secondaryActions,
}: PageHeaderProps) {
    return (
        <div className="mb-5 space-y-3">
            {/* Breadcrumb */}
            {breadcrumb && breadcrumb.length > 0 ? (
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                    {breadcrumb.map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            {i > 0 ? <span className="opacity-40">/</span> : null}
                            {item.href ? (
                                <a href={item.href} className="hover:underline" style={{ color: 'var(--accent)' }}>{item.label}</a>
                            ) : (
                                <span>{item.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            ) : null}

            {/* Title row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h1
                        className="truncate font-semibold tracking-tight"
                        style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--leading-tight)', color: 'var(--fg)' }}
                    >
                        {title}
                    </h1>
                    {subtitle ? (
                        <p className="mt-0.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-muted)' }}>
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                {actions ? (
                    <div className="flex shrink-0 items-center gap-2">{actions}</div>
                ) : null}
            </div>

            {/* Secondary actions / filter bar */}
            {secondaryActions ? (
                <div className="flex flex-wrap items-center gap-2">{secondaryActions}</div>
            ) : null}
        </div>
    );
}
