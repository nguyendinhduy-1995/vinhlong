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
    <section className={`glass-2 rounded-2xl p-4 md:p-5 ${className}`}>
      {title || rightAction ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-[12px]" style={{ color: 'var(--fg-muted)' }}>{subtitle}</p> : null}
          </div>
          {rightAction ? <div className="shrink-0">{rightAction}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
