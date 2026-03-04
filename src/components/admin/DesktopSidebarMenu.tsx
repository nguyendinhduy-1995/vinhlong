"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_MENU, filterMenuByRole, type AdminMenuItem } from "@/lib/admin-menu";
import { hasUiPermission, moduleKeyFromHref } from "@/lib/ui-permissions";

type DesktopSidebarMenuProps = {
  permissions: string[] | undefined;
  isAdmin: boolean;
  userRole?: string;
  items?: AdminMenuItem[];
};

function normalizeVi(input: string) {
  return input.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

const DEFAULT_GROUPS = ["Tổng quan", "Khách & Tư vấn", "Học viên & Lịch", "Tài chính", "Tự động hoá", "Quản trị"] as const;

export function DesktopSidebarMenu({ permissions, isAdmin, userRole, items = ADMIN_MENU }: DesktopSidebarMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([...DEFAULT_GROUPS]);

  const visibleItems = useMemo(() => {
    // Step 1: filter by role (v2 role-based menu)
    const roleFiltered = userRole ? filterMenuByRole(items, userRole) : items;
    // Step 2: filter by permission
    return roleFiltered.filter((item) => {
      const moduleKey = moduleKeyFromHref(item.href);
      if (!moduleKey) return isAdmin;
      return hasUiPermission(permissions, moduleKey, "VIEW");
    });
  }, [isAdmin, items, permissions, userRole]);

  const normalizedQuery = normalizeVi(query);
  const filtered = useMemo(() => {
    if (!normalizedQuery) return visibleItems;
    return visibleItems.filter((item) => {
      const haystack = [item.label, item.href, ...(item.keywords || [])].map(normalizeVi).join(" ");
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, visibleItems]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminMenuItem[]>();
    for (const item of filtered) {
      const rows = map.get(item.group) || [];
      rows.push(item);
      map.set(item.group, rows);
    }
    return DEFAULT_GROUPS.map((group) => ({ group, items: map.get(group) || [] })).filter((g) => g.items.length > 0);
  }, [filtered]);

  function toggleGroup(group: string) {
    setOpenGroups((prev) => (prev.includes(group) ? prev.filter((x) => x !== group) : [...prev, group]));
  }

  return (
    <aside
      className={`hidden h-screen shrink-0 glass-1 md:block transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}
      style={{ borderRight: '0.5px solid var(--border-hairline)', willChange: 'width' }}
    >
      <div className="flex h-full flex-col">
        {/* ── Logo ── */}
        <div className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-4"} pt-5 pb-4`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: 'var(--accent)' }}>
                <span className="text-xs font-black text-white tracking-tight">TD</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>Thầy Duy</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: 'var(--accent)' }}>
              <span className="text-xs font-black text-white tracking-tight">TD</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((x) => !x)}
            className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md transition"
            style={{ color: 'var(--fg-muted)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              {collapsed ? (
                <path d="M4 2L9 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M8 2L3 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        {/* ── Search ── */}
        {!collapsed && (
          <div className="px-3 mb-3">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: 'var(--fg-muted)' }}>
                <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
                <path d="M9 9L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                placeholder="Tìm..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-8 rounded-lg pl-8 pr-2.5 text-[13px] outline-none transition-all focus:ring-2"
                style={{
                  background: 'var(--bg-inset)',
                  border: '0.5px solid var(--border-hairline)',
                  color: 'var(--fg)',
                  '--tw-ring-color': 'var(--border-focus)',
                } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-3">
          {grouped.map((group, gi) => {
            const expanded = openGroups.includes(group.group);
            return (
              <div key={group.group} className="animate-fade-in" style={{ animationDelay: `${gi * 30}ms` }}>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.group)}
                    className="flex w-full items-center justify-between px-2 mb-1"
                  >
                    <span className="font-semibold uppercase tracking-wide" style={{ fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)' }}>
                      {group.group}
                    </span>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
                      className={`transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
                      style={{ color: 'var(--fg-muted)' }}>
                      <path d="M2 3.5L4.5 6L7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                {(collapsed || expanded) && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => router.push(item.href)}
                          title={collapsed ? item.label : undefined}
                          className={`group/item flex w-full items-center text-left rounded-lg transition-all ${collapsed ? "h-9 justify-center px-1" : "h-9 gap-2.5 px-2.5"
                            }`}
                          style={{
                            background: active ? 'var(--accent-bg)' : 'transparent',
                            color: active ? 'var(--accent)' : 'var(--fg-secondary)',
                            fontWeight: active ? 600 : 400,
                          }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--border-hairline)'; }}
                          onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: active ? 'var(--accent)' : 'var(--fg-faint)',
                              opacity: active ? 1 : 0.5,
                            }}
                          />
                          {!collapsed && (
                            <span className="truncate" style={{ fontSize: 'var(--text-sm)' }}>{item.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Bottom ── */}
        <div className={`p-3 ${collapsed ? "text-center" : ""}`} style={{ borderTop: '0.5px solid var(--border-hairline)' }}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-1">
              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: 'var(--accent)' }}>
                A
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium" style={{ color: 'var(--fg)' }}>Admin</p>
                <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--fg-muted)' }}>Quản trị</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: 'var(--accent)' }}>
              A
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
