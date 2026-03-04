"use client";

type BadgeProps = {
  text: string;
  tone?: "neutral" | "primary" | "accent" | "success" | "danger";
  pulse?: boolean;
};

const toneStyles: Record<NonNullable<BadgeProps["tone"]>, { bg: string; color: string; dot: string }> = {
  neutral: { bg: "rgba(142,142,147,0.12)", color: "#8E8E93", dot: "#8E8E93" },
  primary: { bg: "rgba(0,122,255,0.1)", color: "#007AFF", dot: "#007AFF" },
  accent: { bg: "rgba(255,149,0,0.1)", color: "#FF9500", dot: "#FF9500" },
  success: { bg: "rgba(52,199,89,0.1)", color: "#34C759", dot: "#34C759" },
  danger: { bg: "rgba(255,59,48,0.1)", color: "#FF3B30", dot: "#FF3B30" },
};

export function Badge({ text, tone = "neutral", pulse }: BadgeProps) {
  const s = toneStyles[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {pulse ? (
        <span className="relative flex h-[5px] w-[5px]">
          <span className="pulse-dot absolute inset-0 rounded-full opacity-60" style={{ background: s.dot }} />
          <span className="relative inline-flex h-[5px] w-[5px] rounded-full" style={{ background: s.dot }} />
        </span>
      ) : null}
      {text}
    </span>
  );
}
