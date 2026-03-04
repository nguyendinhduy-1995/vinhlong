"use client";

import type { ReactNode } from "react";
import { MobileAdminMenu } from "@/components/mobile/MobileAdminMenu";

type MobileShellProps = {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  children: ReactNode;
};

export function MobileShell({ title, subtitle, leftAction, rightAction, children }: MobileShellProps) {
  return (
    <div className="min-h-full">
      <header className="glass-2 sticky top-0 z-40 px-3 pt-[max(env(safe-area-inset-top),8px)] pb-2 md:hidden" style={{ borderBottom: '0.5px solid var(--border-hairline)' }}>
        <div className="mx-auto flex max-w-screen-sm items-center justify-between gap-2">
          <div className="min-w-0">{leftAction}</div>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{title}</p>
            {subtitle ? <p className="truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>{subtitle}</p> : null}
          </div>
          <div className="min-w-0 text-right">{rightAction}</div>
        </div>
      </header>

      <div className="mx-auto max-w-screen-sm px-3 pb-[calc(max(env(safe-area-inset-bottom),24px)+72px)] md:max-w-none md:px-0 md:pb-0">
        {children}
      </div>
      <MobileAdminMenu />
    </div>
  );
}
