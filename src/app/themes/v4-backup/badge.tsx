"use client";

type BadgeProps = {
  text: string;
  tone?: "neutral" | "primary" | "accent" | "success" | "danger";
  pulse?: boolean;
};

const toneStyles: Record<NonNullable<BadgeProps["tone"]>, { bg: string; color: string; dot: string }> = {
  neutral: { bg: "#F0E6DA", color: "#5C4A35", dot: "#A09484" },
  primary: { bg: "#FDEEE8", color: "#C4522E", dot: "#E8734A" },
  accent: { bg: "#FDF3E3", color: "#9A7420", dot: "#D4A853" },
  success: { bg: "#E6F5EC", color: "#1B7A3D", dot: "#22C55E" },
  danger: { bg: "#FDE8E8", color: "#B91C1C", dot: "#EF4444" },
};

export function Badge({ text, tone = "neutral", pulse }: BadgeProps) {
  const s = toneStyles[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {pulse ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="pulse-dot absolute inset-0 rounded-full opacity-75" style={{ background: s.dot }} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
        </span>
      ) : null}
      {text}
    </span>
  );
}
