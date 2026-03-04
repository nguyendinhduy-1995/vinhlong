"use client";

import { useState, type ReactNode } from "react";

type Tab = {
    key: string;
    label: string;
    icon?: ReactNode;
};

type TabsProps = {
    tabs: Tab[];
    activeKey: string;
    onChange: (key: string) => void;
    /** Visual style: segmented (macOS pill) or underline */
    variant?: "segmented" | "underline";
};

/**
 * macOS-style Segmented Control / Tabs component.
 * Supports pill (segmented) and underline variants.
 */
export function Tabs({ tabs, activeKey, onChange, variant = "segmented" }: TabsProps) {
    if (variant === "underline") {
        return (
            <div
                className="flex gap-0 overflow-x-auto"
                style={{ borderBottom: '0.5px solid var(--border-hairline)' }}
                role="tablist"
            >
                {tabs.map((tab) => {
                    const active = tab.key === activeKey;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(tab.key)}
                            className="relative flex shrink-0 items-center gap-1.5 px-4 pb-2.5 pt-1 transition-colors"
                            style={{
                                fontSize: 'var(--text-sm)',
                                fontWeight: active ? 600 : 500,
                                color: active ? 'var(--accent)' : 'var(--fg-tertiary)',
                            }}
                        >
                            {tab.icon}{tab.label}
                            {active ? (
                                <span
                                    className="absolute inset-x-2 -bottom-px h-[2px] rounded-full"
                                    style={{ background: 'var(--accent)' }}
                                />
                            ) : null}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Segmented control (pill-style, macOS)
    return (
        <div
            className="inline-flex items-center gap-0.5 p-[3px]"
            style={{
                borderRadius: 'var(--radius)',
                background: 'var(--bg-inset)',
                border: '0.5px solid var(--border-hairline)',
            }}
            role="tablist"
        >
            {tabs.map((tab) => {
                const active = tab.key === activeKey;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(tab.key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 transition-all"
                        style={{
                            borderRadius: 'calc(var(--radius) - 3px)',
                            fontSize: 'var(--text-sm)',
                            fontWeight: active ? 600 : 500,
                            color: active ? 'var(--fg)' : 'var(--fg-muted)',
                            background: active ? 'var(--bg-elevated)' : 'transparent',
                            boxShadow: active ? 'var(--shadow-sm)' : 'none',
                        }}
                    >
                        {tab.icon}{tab.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Stateful wrapper for convenient usage */
export function useTabs(tabs: Tab[], defaultKey?: string) {
    const [activeKey, setActiveKey] = useState(defaultKey || tabs[0]?.key || "");
    return { activeKey, setActiveKey, tabs };
}
