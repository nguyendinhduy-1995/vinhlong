"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { ADMIN_MENU, GROUP_COLORS, type AdminMenuItem } from "@/lib/admin-menu";
import { fetchMe } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/admin-auth";
import { hasUiPermission, moduleKeyFromHref } from "@/lib/ui-permissions";

type MobileAdminMenuProps = {
  items?: AdminMenuItem[];
  enableQuickAdd?: boolean;
};

function normalizeVi(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/* ── iOS 26 Floating Tab Bar — 5 primary tabs ── */
const TAB_ITEMS = [
  { key: "home", label: "Trang chủ", href: "/dashboard", match: "/dashboard" },
  { key: "leads", label: "Khách", href: "/leads", match: "/leads" },
  { key: "finance", label: "Tài chính", href: "/receipts", match: "/receipts|/expenses" },
  { key: "schedule", label: "Lịch", href: "/schedule", match: "/schedule|/courses|/students" },
  { key: "more", label: "Menu", href: "__menu__", match: "__never__" },
];

export function MobileAdminMenu({ items = ADMIN_MENU }: MobileAdminMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([
    "Tổng quan",
    "Khách & Tư vấn",
    "Học viên & Lịch",
    "Tài chính",
    "Tự động hoá",
    "Quản trị",
  ]);

  useEffect(() => {
    fetchMe()
      .then((me) => {
        setPermissions(me.user.permissions || []);
        setIsAdmin(isAdminRole(me.user.role));
      })
      .catch(() => {
        setPermissions([]);
        setIsAdmin(false);
      });
  }, []);

  const normalizedQuery = normalizeVi(query);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const moduleKey = moduleKeyFromHref(item.href);
      if (!moduleKey) return isAdmin;
      return hasUiPermission(permissions, moduleKey, "VIEW");
    });
  }, [isAdmin, items, permissions]);

  const filtered = useMemo(() => {
    if (!normalizedQuery) return visibleItems;
    return visibleItems.filter((item) => {
      const label = normalizeVi(item.label);
      const href = normalizeVi(item.href);
      const keywords = (item.keywords || []).map(normalizeVi);
      return label.includes(normalizedQuery) || href.includes(normalizedQuery) || keywords.some((k) => k.includes(normalizedQuery));
    });
  }, [normalizedQuery, visibleItems]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminMenuItem[]>();
    filtered.forEach((item) => {
      const list = map.get(item.group) || [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  function toggleGroup(group: string) {
    setOpenGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }

  function isTabActive(tab: typeof TAB_ITEMS[number]) {
    return tab.match.split("|").some((m) => pathname.startsWith(m));
  }

  function handleTabClick(tab: typeof TAB_ITEMS[number]) {
    if (tab.href === "__menu__") {
      setMenuOpen(true);
      return;
    }
    router.push(tab.href);
  }

  function renderGroupList() {
    if (grouped.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-[var(--bg-elevated)] px-3 py-5 text-center text-sm" style={{ color: 'var(--fg-muted)' }}>
          Không có kết quả phù hợp.
        </div>
      );
    }

    return grouped.map(([group, menuItems], groupIdx) => {
      const expanded = openGroups.includes(group);
      const colors = GROUP_COLORS[group] || GROUP_COLORS["Quản trị"];
      return (
        <div
          key={group}
          className="overflow-hidden rounded-2xl glass-2 animate-fade-in-up"
          style={{ animationDelay: `${groupIdx * 50}ms` }}
        >
          <div className={`h-0.5 bg-gradient-to-r ${colors.from} ${colors.to}`} />
          <button
            type="button"
            onClick={() => toggleGroup(group)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-semibold transition active:bg-black/[0.02]"
            style={{ color: 'var(--fg)' }}
          >
            <span>{group}</span>
            <span className="transition-transform duration-200" style={{ color: 'var(--fg-muted)' }}>
              {expanded ? "▾" : "▸"}
            </span>
          </button>
          {expanded ? (
            <div className="space-y-0.5 px-2 pb-2">
              {menuItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      router.push(item.href);
                      setMenuOpen(false);
                    }}
                    className={`tap-feedback flex h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] transition-all duration-200 ${active
                        ? "glass-accent font-semibold"
                        : "hover:bg-black/[0.02]"
                      }`}
                    style={{ color: active ? 'var(--accent)' : 'var(--text-secondary)' }}
                  >
                    <span className="flex h-5 w-5 items-center justify-center">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: active ? 'var(--accent)' : 'var(--muted)' }}
                      />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    });
  }

  return (
    <>
      {/* ── iOS 26 Floating Pill Tab Bar ── */}
      <nav aria-label="Thanh điều hướng chính" className="ios26-floating-bar md:hidden">
        <div className="mx-auto flex w-full max-w-[420px] items-center justify-around glass-3 rounded-[22px] px-1 py-1.5 animate-fade-in-up">
          {TAB_ITEMS.map((tab) => {
            const active = tab.href !== "__menu__" && isTabActive(tab);
            const isMenu = tab.href === "__menu__";
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab)}
                className={`tap-feedback flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-250 min-w-[56px] ${active ? "rounded-full px-4 py-1.5 font-semibold" : ""
                  }`}
                style={{
                  background: active ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
                  color: active ? 'var(--accent)' : isMenu ? 'var(--text-secondary)' : 'var(--muted)',
                }}
                aria-current={active ? "page" : undefined}
              >
                {/* Minimal text-only icon, iOS 26 style */}
                <span className="text-[11px] font-bold leading-none" style={{ letterSpacing: '0.02em' }}>
                  {tab.key === "home" && "⌂"}
                  {tab.key === "leads" && "◉"}
                  {tab.key === "finance" && "¥"}
                  {tab.key === "schedule" && "▦"}
                  {tab.key === "more" && "···"}
                </span>
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Full Menu Bottom Sheet ── */}
      <BottomSheet open={menuOpen} onOpenChange={setMenuOpen} title="Điều hướng">
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Tìm tính năng..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="!rounded-xl !border-[var(--border-subtle)] !bg-[var(--bg-elevated)] focus:!border-blue-400 transition-all"
            />
          </div>
          {renderGroupList()}
        </div>
      </BottomSheet>
    </>
  );
}
