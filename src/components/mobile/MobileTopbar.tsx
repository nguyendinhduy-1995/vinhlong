"use client";

import type { ReactNode } from "react";
import { UI_TEXT } from "@/lib/ui-text.vi";

type MobileTopbarProps = {
  title: string;
  subtitle?: string;
  onOpenMenu?: () => void;
  rightAction?: ReactNode;
};

export function MobileTopbar({ title, subtitle, onOpenMenu, rightAction }: MobileTopbarProps) {
  return (
    <header className="sticky top-0 z-40 glass-2 lg:hidden" style={{ borderBottom: '0.5px solid var(--border-hairline)' }}>
      <div className="mx-auto flex h-14 max-w-[420px] items-center justify-between px-3">
        {onOpenMenu ? (
          <button
            type="button"
            onClick={onOpenMenu}
            className="tap-feedback inline-flex h-10 items-center rounded-xl px-3 text-[13px] font-medium transition" style={{ color: 'var(--accent)' }}
            aria-label="Mở menu"
          >
            {UI_TEXT.common.menu}
          </button>
        ) : (
          <div className="h-10 min-w-[72px]" />
        )}
        <div className="min-w-0 px-2 text-center">
          <p className="truncate text-[15px] font-semibold" style={{ color: 'var(--fg)' }}>{title}</p>
          {subtitle ? <p className="truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>{subtitle}</p> : null}
        </div>
        <div className="min-w-[72px] shrink-0 text-right">{rightAction}</div>
      </div>
    </header>
  );
}
