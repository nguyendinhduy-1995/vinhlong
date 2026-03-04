"use client";

import { ReactNode, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, description, children, footer, onClose }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Auto-focus first input on open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const el = dialogRef.current;
      if (!el) return;
      const first = el.querySelector<HTMLElement>("input:not([type=hidden]),select,textarea");
      first?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [open]);

  // ESC close + focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const el = dialogRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className="animate-modal-backdrop fixed inset-0 z-50 flex items-end justify-center md:items-center"
      style={{
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
        paddingTop: '16px',
        paddingLeft: '8px',
        paddingRight: '8px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-modal-sheet glass-4 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden md:max-h-[80vh]"
        style={{ borderRadius: 'var(--radius-2xl)' }}
      >
        {/* header */}
        <div className="shrink-0 px-5 py-4 md:px-6" style={{ borderBottom: '0.5px solid var(--border-hairline)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold" style={{ fontSize: 'var(--text-lg)', color: 'var(--fg)' }}>{title}</h2>
              {description ? <p className="mt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-muted)' }}>{description}</p> : null}
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Đóng cửa sổ">✕</Button>
          </div>
        </div>
        {/* scrollable body */}
        <div className="flex-1 overflow-auto p-5 pb-6 md:p-6">{children}</div>
        {/* sticky footer */}
        {footer ? (
          <div className="shrink-0 px-5 py-3 md:px-6" style={{ borderTop: '0.5px solid var(--border-hairline)', background: 'var(--bg-inset)' }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
