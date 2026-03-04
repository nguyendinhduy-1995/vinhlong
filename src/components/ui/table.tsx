"use client";

import { ReactNode } from "react";

type TableProps = {
  headers: string[];
  children: ReactNode;
};

export function Table({ headers, children }: TableProps) {
  return (
    <div className="table-mobile-cards overflow-hidden glass-2" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left" style={{ fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border-hairline)', background: 'var(--bg-inset)' }}>
              {headers.map((header) => (
                <th key={header} className="px-4 py-2.5 font-semibold uppercase tracking-wide" style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-muted)' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
