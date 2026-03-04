"use client";

import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, subtitle, rightAction, children, className = "" }: SectionCardProps) {
  return (
    <section className={`v4-card rounded-3xl p-5 md:p-6 ${className}`}>
      {title || rightAction ? (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{subtitle}</p> : null}
          </div>
          {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
