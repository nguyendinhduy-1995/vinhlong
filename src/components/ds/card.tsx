"use client";

import type { ReactNode, HTMLAttributes } from "react";

type GlassLevel = 1 | 2 | 3 | 4;

type CardProps = HTMLAttributes<HTMLDivElement> & {
    glass?: GlassLevel;
    /** Accent-tinted card */
    accent?: boolean;
    /** Padding preset: none / sm / md / lg */
    padding?: "none" | "sm" | "md" | "lg";
    children: ReactNode;
};

const padMap = { none: "", sm: "p-3", md: "p-4", lg: "p-5" };

export function Card({
    glass = 2,
    accent = false,
    padding = "md",
    className = "",
    children,
    ...rest
}: CardProps) {
    const glassClass = accent ? "glass-accent" : `glass-${glass}`;
    return (
        <div
            className={`${glassClass} ${padMap[padding]} ${className}`}
            style={{ borderRadius: "var(--radius-lg)" }}
            {...rest}
        >
            {children}
        </div>
    );
}

/** Solid card for nesting inside glass containers */
export function SolidCard({
    className = "",
    children,
    ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
    return (
        <div
            className={`surface ${className}`}
            style={{ borderRadius: "var(--radius)" }}
            {...rest}
        >
            {children}
        </div>
    );
}
