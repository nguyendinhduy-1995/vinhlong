"use client";

import { ReactNode } from "react";

type TableProps = {
  headers: string[];
  children: ReactNode;
};

export function Table({ headers, children }: TableProps) {
  return (
    <div className="table-mobile-cards overflow-hidden rounded-3xl v4-card">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr]:table-row-hover" style={{ '--divide-color': 'var(--border-light)' } as React.CSSProperties}>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
