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
    <header className="animate-fadeInUp v4-hero relative rounded-3xl px-6 py-6 md:px-8 md:py-7">
      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 truncate text-xl font-extrabold tracking-tight text-white md:text-2xl">
            {icon ? <span className="text-2xl drop-shadow-sm">{icon}</span> : null}
            {title}
          </h1>
          {subtitle ? <p className="mt-1.5 text-sm text-white/70 font-medium">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
