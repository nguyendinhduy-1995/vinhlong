"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logoutSession, type MeResponse } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/admin-auth";
import { guardByAuthMe, type AuthGuardResult } from "@/lib/ui-auth-guard";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { MobileTopbar } from "@/components/mobile/MobileTopbar";
import { MobileAdminMenu } from "@/components/mobile/MobileAdminMenu";
import { DesktopSidebarMenu } from "@/components/admin/DesktopSidebarMenu";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ToastProvider } from "@/components/ui/toast";
import { TrackingScriptsClient } from "@/components/tracking/TrackingScriptsClient";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/ds/theme-toggle";
import { CommandPalette } from "@/components/ds/command-palette";
import { KeyboardShortcutsDialog } from "@/components/ds/keyboard-shortcuts";
import { NotificationBadge } from "@/components/ds/notification-badge";
import { APP_DESCRIPTION, APP_SHORT } from "@/lib/app-meta";

function roleLabel(role: string) {
  if (role === "admin") return "Quản trị";
  if (role === "manager") return "Quản lý";
  if (role === "telesales") return "Tư vấn";
  if (role === "direct_page") return "Trực page";
  if (role === "viewer") return "Chỉ xem";
  return role;
}

function guessPageTitle(pathname: string) {
  const map: Array<{ test: (path: string) => boolean; title: string; subtitle: string }> = [
    { test: (p) => p.startsWith("/dashboard"), title: "Tổng quan", subtitle: "Theo dõi nhanh vận hành trong ngày" },
    { test: (p) => p.startsWith("/leads/board"), title: "Bảng trạng thái", subtitle: "Theo dõi pipeline khách hàng theo trạng thái" },
    { test: (p) => p.startsWith("/leads"), title: "Khách hàng", subtitle: "Quản lý danh sách và lịch sử tương tác" },
    { test: (p) => p.startsWith("/kpi/daily"), title: "KPI ngày", subtitle: "Báo cáo chỉ số theo thời gian" },
    { test: (p) => p.startsWith("/ai/kpi-coach"), title: "Trợ lý công việc", subtitle: "Gợi ý việc nên làm theo dữ liệu và mục tiêu" },
    { test: (p) => p.startsWith("/kpi/targets"), title: "Mục tiêu KPI", subtitle: "Thiết lập mục tiêu theo vai trò, chi nhánh và ngày trong tuần" },
    { test: (p) => p.startsWith("/goals"), title: "Mục tiêu ngày/tháng", subtitle: "Thiết lập doanh thu, hồ sơ và chi phí theo kỳ" },
    { test: (p) => p.startsWith("/students"), title: "Học viên", subtitle: "Danh sách học viên và tiến độ học tập" },
    { test: (p) => p.startsWith("/courses"), title: "Khóa học", subtitle: "Quản lý khóa học và lịch đào tạo" },
    { test: (p) => p.startsWith("/schedule"), title: "Lịch học", subtitle: "Vận hành buổi học và điểm danh" },
    { test: (p) => p.startsWith("/receipts"), title: "Thu tiền", subtitle: "Theo dõi phiếu thu và dòng tiền" },
    { test: (p) => p.startsWith("/expenses"), title: "Chi phí", subtitle: "Theo dõi chi phí vận hành theo ngày và tháng" },
    { test: (p) => p.startsWith("/notifications"), title: "Thông báo", subtitle: "Danh sách việc cần xử lý" },
    { test: (p) => p.startsWith("/outbound"), title: "Gọi nhắc", subtitle: "Hàng đợi và lịch sử nhắc học viên" },
    { test: (p) => p.startsWith("/admin/n8n"), title: "Luồng n8n", subtitle: "Tài liệu luồng tự động và runbook tích hợp" },
    { test: (p) => p.startsWith("/admin/automation-monitor"), title: "Giám sát luồng tự động", subtitle: "Theo dõi job, lỗi và nhật ký chạy trong ngày" },
    { test: (p) => p.startsWith("/api-hub"), title: "API Hub", subtitle: "Tra cứu API và cách đấu nối nhanh" },
    { test: (p) => p.startsWith("/admin/analytics"), title: "Phân tích truy cập", subtitle: "Theo dõi người dùng, lượt xem và chuyển đổi" },
    { test: (p) => p.startsWith("/admin/integrations/meta"), title: "Meta Pixel & CAPI", subtitle: "Quản lý Facebook Pixel và Conversions API" },
    { test: (p) => p.startsWith("/admin"), title: "Quản trị", subtitle: "Thiết lập và vận hành hệ thống" },
  ];
  return map.find((item) => item.test(pathname)) || { title: APP_SHORT, subtitle: APP_DESCRIPTION };
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [guardResult, setGuardResult] = useState<AuthGuardResult | null>(null);
  const guardStartedRef = useRef(false);

  const pageMeta = useMemo(() => guessPageTitle(pathname), [pathname]);
  const usePageMobileShell =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/kpi/daily") ||
    pathname.startsWith("/ai/kpi-coach") ||
    pathname.startsWith("/kpi/targets") ||
    pathname.startsWith("/goals");

  useEffect(() => {
    if (guardStartedRef.current) return;
    guardStartedRef.current = true;
    let cancelled = false;

    guardByAuthMe(router)
      .then((result) => {
        if (cancelled) return;
        setGuardResult(result);
        if (result.state === "ok") setUser(result.user);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    document.title = `${pageMeta.title} | ${APP_SHORT}`;
  }, [pageMeta.title]);

  async function logout() {
    try {
      await logoutSession();
    } catch {
      // no-op
    }
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg-inset)' }}>
        <div className="flex items-center gap-2.5 text-[color:var(--fg-muted)]">
          <Spinner /> <span className="text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (guardResult?.state === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'var(--bg-inset)' }}>
        <div className="glass-2 w-full max-w-md p-6 text-center">
          <p className="text-base font-semibold text-[color:var(--fg)]">Bạn không có quyền truy cập</p>
          <p className="mt-2 text-sm text-[color:var(--fg-muted)]">Liên hệ quản trị viên để được cấp quyền phù hợp.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => router.replace("/dashboard")}>Về trang chủ</Button>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      </div>
    );
  }

  if (guardResult?.state === "unauthorized") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'var(--bg-inset)' }}>
        <div className="glass-2 w-full max-w-md p-6 text-center">
          <p className="text-base font-semibold text-[color:var(--fg)]">Phiên đăng nhập không hợp lệ</p>
          <p className="mt-2 text-sm text-[color:var(--fg-muted)]">Đang chuyển đến trang đăng nhập...</p>
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => router.replace("/login")}>Đăng nhập ngay</Button>
          </div>
        </div>
      </div>
    );
  }

  if (guardResult?.state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'var(--bg-inset)' }}>
        <div className="glass-2 w-full max-w-md p-6 text-center">
          <p className="text-base font-semibold text-[color:var(--fg)]">Không thể tải phiên đăng nhập</p>
          <p className="mt-2 text-sm text-[color:var(--fg-muted)]">{guardResult.message}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={() => router.replace("/login")}>Đăng nhập lại</Button>
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen" style={{ background: 'var(--bg-inset)' }}>
          {/* Skip to content — visible on keyboard focus */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--fg)] focus:shadow-lg"
          >
            Bỏ qua điều hướng
          </a>
          <div className="flex min-h-screen">
            <DesktopSidebarMenu permissions={user?.permissions} isAdmin={Boolean(user && isAdminRole(user.role))} userRole={user?.role} />

            <div className="min-w-0 flex-1">
              {!usePageMobileShell ? (
                <MobileTopbar
                  title={pageMeta.title}
                  subtitle={pageMeta.subtitle}
                  rightAction={
                    <span className="inline-flex rounded-full px-2 py-[2px] text-[11px] font-semibold" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {user ? roleLabel(user.role) : ""}
                    </span>
                  }
                />
              ) : null}

              <header aria-label="Thanh điều hướng desktop" className="glass-2 sticky top-0 z-30 hidden md:block" style={{ borderBottom: '0.5px solid var(--border-hairline)' }}>
                <div className="flex items-center justify-between px-6 py-2.5">
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>{pageMeta.title}</p>
                    <p className="text-[12px]" style={{ color: 'var(--fg-muted)' }}>{pageMeta.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ThemeToggle />
                    <NotificationBadge onClick={() => router.push("/notifications")} />
                    <button
                      type="button"
                      onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                      className="hidden items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] px-2.5 py-1 text-[11px] font-medium lg:inline-flex"
                      style={{ color: 'var(--fg-muted)', background: 'var(--bg-elevated)' }}
                    >
                      🔍 Tìm kiếm
                      <kbd className="ml-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-inset)] px-1 py-0.5 text-[9px] font-mono">⌘K</kbd>
                    </button>
                    <span className="hidden rounded-full px-2.5 py-1 text-[12px] font-medium lg:inline-flex" style={{ background: 'var(--bg-inset)', color: 'var(--fg-secondary)' }}>
                      {user ? `${user.name || user.email} · ${roleLabel(user.role)}` : ""}
                    </span>
                    <Button variant="ghost" onClick={logout}>Đăng xuất</Button>
                  </div>
                </div>
              </header>

              <main id="main-content" className={`mx-auto w-full max-w-[1200px] px-4 py-5 ${usePageMobileShell ? "pb-6" : "pb-24"} md:px-6 md:py-6 md:pb-10`}>
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
            </div>
          </div>

          {!usePageMobileShell ? <MobileAdminMenu /> : null}
          <CommandPalette />
          <KeyboardShortcutsDialog />
          <TrackingScriptsClient site="CRM" />
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
