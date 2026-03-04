"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <header className="animate-fade-in-up mb-1">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-bold tracking-tight md:text-[34px]" style={{ color: 'var(--fg)', letterSpacing: '-0.03em' }}>
            {icon ? <span className="text-[28px] md:text-[34px]">{icon}</span> : null}
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-[15px]" style={{ color: 'var(--fg-muted)' }}>{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
