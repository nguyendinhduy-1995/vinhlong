"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

const icons = {
    light: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.17 3.17l1.06 1.06M11.77 11.77l1.06 1.06M3.17 12.83l1.06-1.06M11.77 4.23l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    ),
    dark: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 9.37A6 6 0 116.63 2a7 7 0 007.37 7.37z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    auto: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2a6 6 0 010 12V2z" fill="currentColor" fillOpacity="0.3" />
        </svg>
    ),
};

const labels = { auto: "Tự động", light: "Sáng", dark: "Tối" };
const cycle = { auto: "light", light: "dark", dark: "auto" } as const;

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={() => setTheme(cycle[theme] as "auto" | "light" | "dark")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 transition-all"
            style={{
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--fg-tertiary)',
                background: 'transparent',
            }}
            title={`Chế độ: ${labels[theme]} (hiện tại: ${resolvedTheme})`}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--border-hairline)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
            {icons[theme]}
            <span className="hidden sm:inline">{labels[theme]}</span>
        </button>
    );
}
