"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_MENU, type AdminMenuItem } from "@/lib/admin-menu";
import { hasUiPermission, moduleKeyFromHref } from "@/lib/ui-permissions";

type DesktopSidebarMenuProps = {
  permissions: string[] | undefined;
  isAdmin: boolean;
  items?: AdminMenuItem[];
};

function normalizeVi(input: string) {
  return input.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

const DEFAULT_GROUPS = ["Tổng quan", "Khách & Tư vấn", "Học viên & Lịch", "Tài chính", "Tự động hoá", "Quản trị"] as const;

export function DesktopSidebarMenu({ permissions, isAdmin, items = ADMIN_MENU }: DesktopSidebarMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([...DEFAULT_GROUPS]);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const moduleKey = moduleKeyFromHref(item.href);
      if (!moduleKey) return isAdmin;
      return hasUiPermission(permissions, moduleKey, "VIEW");
    });
  }, [isAdmin, items, permissions]);

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
    <aside className={`hidden h-screen shrink-0 v4-sidebar md:block transition-all duration-300 ease-out ${collapsed ? "w-[72px]" : "w-[248px]"}`}>
      <div className="flex h-full flex-col">
        {/* ── Logo ── */}
        <div className={`flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"} pt-6 pb-5`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--accent)' }}>
                <span className="text-sm font-black text-white">TD</span>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Thầy Duy</p>
                <p className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>CRM</p>
              </div>
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--accent)' }}>
              <span className="text-sm font-black text-white">TD</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((x) => !x)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-black/5"
            style={{ color: 'var(--muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {collapsed ? (
                <path d="M5 3L10 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M9 3L4 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        {/* ── Search ── */}
        {!collapsed && (
          <div className="px-4 mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--muted)' }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <input
                placeholder="Tìm..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-9 rounded-xl pl-9 pr-3 text-[13px] outline-none transition-all focus:ring-2"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  '--tw-ring-color': 'var(--ring)',
                } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-4">
          {grouped.map((group, gi) => {
            const expanded = openGroups.includes(group.group);
            return (
              <div key={group.group} className="animate-fadeIn" style={{ animationDelay: `${gi * 30}ms` }}>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.group)}
                    className="flex w-full items-center justify-between px-2 mb-1.5"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--muted)' }}>
                      {group.group}
                    </span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                      className={`transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
                      style={{ color: 'var(--muted)' }}>
                      <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
                {(collapsed || expanded) && (
                  <div className={collapsed ? "space-y-1" : "space-y-0.5"}>
                    {group.items.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => router.push(item.href)}
                          title={collapsed ? item.label : undefined}
                          className={`v4-sidebar-item group/item flex w-full items-center text-left ${collapsed ? "h-10 justify-center px-2" : "h-[38px] gap-2.5 px-3"
                            } ${active ? "v4-sidebar-active" : ""}`}
                          style={!active ? { color: 'var(--text-secondary)' } : undefined}
                        >
                          <span className={`text-[15px] transition-transform duration-150 group-hover/item:scale-110 ${active ? "drop-shadow-sm" : ""
                            }`}>
                            {item.icon || "•"}
                          </span>
                          {!collapsed && (
                            <span className="truncate text-[13px] font-medium">{item.label}</span>
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

        {/* ── Bottom user section ── */}
        <div className={`border-t p-4 ${collapsed ? "text-center" : ""}`} style={{ borderColor: 'var(--border)' }}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--accent)' }}>
                A
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold" style={{ color: 'var(--text)' }}>Admin</p>
                <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Quản trị viên</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--accent)' }}>
              A
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
