"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
    theme: "auto",
    resolvedTheme: "light",
    setTheme: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

const STORAGE_KEY = "admin-theme";

/** Resolve "auto" to light/dark based on VN timezone (Asia/Ho_Chi_Minh) */
function resolveAuto(): ResolvedTheme {
    try {
        const vnHour = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "numeric",
            hour12: false,
        });
        const h = parseInt(vnHour, 10);
        return h >= 6 && h < 18 ? "light" : "dark";
    } catch {
        // Fallback: check system preference
        if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    }
}

function resolve(theme: Theme): ResolvedTheme {
    if (theme === "light") return "light";
    if (theme === "dark") return "dark";
    return resolveAuto();
}

function applyTheme(resolved: ResolvedTheme) {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === "undefined") return "auto";
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        return stored && ["auto", "light", "dark"].includes(stored) ? stored : "auto";
    });
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(theme));

    // Apply theme on first render
    useEffect(() => {
        applyTheme(resolvedTheme);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-check auto mode every minute
    useEffect(() => {
        if (theme !== "auto") return;
        const interval = setInterval(() => {
            const r = resolveAuto();
            setResolvedTheme(r);
            applyTheme(r);
        }, 60_000);
        return () => clearInterval(interval);
    }, [theme]);

    // Listen for system theme changes (for auto mode fallback)
    useEffect(() => {
        if (theme !== "auto" || typeof window === "undefined") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => {
            const r = resolveAuto();
            setResolvedTheme(r);
            applyTheme(r);
        };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        localStorage.setItem(STORAGE_KEY, t);
        const r = resolve(t);
        setResolvedTheme(r);
        applyTheme(r);
    }, []);

    const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Anti-FOUC script — inline in <head> before React hydrates.
 * Reads localStorage and applies data-theme immediately.
 */
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t === 'dark') { document.documentElement.setAttribute('data-theme','dark'); return; }
    if (t === 'light') { document.documentElement.setAttribute('data-theme','light'); return; }
    // auto mode — check VN time
    var h = parseInt(new Date().toLocaleString('en-US',{timeZone:'Asia/Ho_Chi_Minh',hour:'numeric',hour12:false}),10);
    document.documentElement.setAttribute('data-theme', (h>=6 && h<18) ? 'light' : 'dark');
  } catch(e) {
    document.documentElement.setAttribute('data-theme','light');
  }
})();
`;
