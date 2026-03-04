"use client";

type StatPillItem = {
  label: string;
  value: string | number;
};

type StatPillsProps = {
  items: StatPillItem[];
};

export function StatPills({ items }: StatPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5">
          <span className="text-[11px] text-[color:var(--fg-muted)]">{item.label}: </span>
          <span className="text-xs font-semibold text-[color:var(--fg)]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
