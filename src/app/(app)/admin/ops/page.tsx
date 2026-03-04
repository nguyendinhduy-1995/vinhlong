"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, fetchMe, getToken } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/admin-auth";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileToolbar } from "@/components/app/mobile-toolbar";
import { MobileFiltersSheet } from "@/components/mobile/MobileFiltersSheet";
import { DataCard } from "@/components/mobile/DataCard";
import { EmptyState } from "@/components/mobile/EmptyState";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTimeVi } from "@/lib/date-utils";

type Role = "PAGE" | "TELESALES";
type OpsStatus = "OK" | "WARNING" | "CRITICAL";

type UserOption = {
  id: string;
  name: string | null;
  email: string;
};

type OpsItem = {
  id: string;
  createdAt: string;
  role: Role;
  ownerId: string | null;
  owner: UserOption | null;
  branch: { id: string; name: string; code: string | null } | null;
  dateKey: string;
  windowMinutes: number;
  computedJson: {
    status?: OpsStatus;
    metrics?: Record<string, number>;
    gaps?: Record<string, number>;
    daily?: {
      messagesToday?: number;
      dataToday?: number;
      dataRatePctDaily?: number;
    };
    target?: {
      dataRatePctTarget?: number;
    };
    gap?: {
      dataRatePct?: number;
    };
    suggestions?: string[];
    checklist?: string[];
  };
};

type OpsListResponse = {
  items: OpsItem[];
  aggregate: {
    total: number;
    statusCounts: Record<OpsStatus, number>;
    latestByRole: Partial<Record<Role, OpsItem>>;
  };
};

type UsersResponse = {
  items: Array<{ id: string; name: string | null; email: string }>;
};

function parseApiError(error: ApiClientError) {
  return `${error.code}: ${error.message}`;
}

function todayHcm() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

function statusTone(status?: OpsStatus) {
  if (status === "OK") return "accent" as const;
  if (status === "CRITICAL") return "danger" as const;
  return "neutral" as const;
}

function roleLabel(role: Role) {
  return role === "PAGE" ? "Trực Page" : "Telesales";
}

function formatPct(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

export default function AdminOpsPage() {
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [items, setItems] = useState<OpsItem[]>([]);
  const [aggregate, setAggregate] = useState<OpsListResponse["aggregate"] | null>(null);
  const [owners, setOwners] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dateKey, setDateKey] = useState(todayHcm());
  const [role, setRole] = useState<"" | Role>("");
  const [ownerId, setOwnerId] = useState("");
  const [limit, setLimit] = useState("50");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const handleAuthError = useCallback(
    (err: ApiClientError) => {
      if (err.code === "AUTH_MISSING_BEARER" || err.code === "AUTH_INVALID_TOKEN") {
        clearToken();
        router.replace("/login");
        return true;
      }
      return false;
    },
    [router]
  );

  useEffect(() => {
    fetchMe()
      .then((data) => setIsAdmin(isAdminRole(data.user.role)))
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setCheckingRole(false));
  }, [router]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (dateKey) params.set("dateKey", dateKey);
    if (role) params.set("role", role);
    if (ownerId) params.set("ownerId", ownerId);
    if (limit) params.set("limit", limit);
    return params.toString();
  }, [dateKey, role, ownerId, limit]);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token || !isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const [opsData, ownerData] = await Promise.all([
        fetchJson<OpsListResponse>(`/api/admin/ops/pulse?${query}`, { token }),
        fetchJson<UsersResponse>("/api/users?role=telesales&isActive=true&page=1&pageSize=200", { token }).catch(() => ({ items: [] })),
      ]);
      setItems(opsData.items || []);
      setAggregate(opsData.aggregate);
      setOwners(ownerData.items || []);
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, isAdmin, query]);

  useEffect(() => {
    if (isAdmin) void loadData();
  }, [isAdmin, loadData]);

  if (checkingRole) {
    return (
      <div className="flex items-center gap-2 text-[color:var(--fg)]">
        <Spinner /> Đang kiểm tra quyền...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-3 rounded-xl bg-[var(--card-bg)] p-6 shadow-sm">
        <Alert type="error" message="Bạn không có quyền truy cập." />
        <Link href="/dashboard" className="inline-block rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[color:var(--fg)]">
          Về tổng quan
        </Link>
      </div>
    );
  }

  const latestPage = aggregate?.latestByRole?.PAGE;
  const latestSales = aggregate?.latestByRole?.TELESALES;

  return (
    <div className="space-y-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">🤖</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>AI hỗ trợ nhân sự</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Theo dõi snapshot 10 phút từ n8n và gợi ý việc cần làm</p>
          </div>
          <Button variant="secondary" onClick={loadData} disabled={loading} >
            {loading ? "Đang tải..." : "🔄 Làm mới"}
          </Button>
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}

      <div className="sticky top-[116px] z-20 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/90 p-2 backdrop-blur md:hidden">
        <MobileToolbar
          value=""
          onChange={() => { }}
          onOpenFilter={() => setMobileFilterOpen(true)}
          activeFilterCount={(role ? 1 : 0) + (ownerId ? 1 : 0) + (dateKey ? 1 : 0)}
          quickActions={<Button variant="secondary" onClick={loadData}>Làm mới</Button>}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-[color:var(--fg-muted)]">Trực Page (10p)</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge text={latestPage?.computedJson?.status || "Chưa có"} tone={statusTone(latestPage?.computedJson?.status)} />
            <span className="text-xs text-[color:var(--fg-muted)]">{latestPage ? formatDateTimeVi(latestPage.createdAt) : "-"}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[color:var(--fg)]">
            <div>Tin nhắn hôm nay: <span className="font-semibold">{latestPage?.computedJson?.daily?.messagesToday ?? 0}</span></div>
            <div>Data hôm nay: <span className="font-semibold">{latestPage?.computedJson?.daily?.dataToday ?? 0}</span></div>
            <div>% ra Data hôm nay: <span className="font-semibold">{formatPct(latestPage?.computedJson?.daily?.dataRatePctDaily)}</span></div>
            <div>Target %: <span className="font-semibold">{formatPct(latestPage?.computedJson?.target?.dataRatePctTarget)}</span></div>
            <div className="col-span-2">Chênh lệch %: <span className="font-semibold">{formatPct(latestPage?.computedJson?.gap?.dataRatePct)}</span></div>
          </div>
          <div className="mt-2 text-sm text-[color:var(--fg)]">{latestPage?.computedJson?.suggestions?.[0] || "Chưa có snapshot mới."}</div>
        </div>

        <div className="surface rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-[color:var(--fg-muted)]">Tư vấn viên (10 phút)</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge text={latestSales?.computedJson?.status || "Chưa có"} tone={statusTone(latestSales?.computedJson?.status)} />
            <span className="text-xs text-[color:var(--fg-muted)]">{latestSales ? formatDateTimeVi(latestSales.createdAt) : "-"}</span>
          </div>
          <div className="mt-3 text-sm text-[color:var(--fg)]">
            {latestSales?.computedJson?.suggestions?.[0] || "Chưa có snapshot mới."}
          </div>
        </div>
      </div>

      <div className="hidden overflow-hidden glass-2 rounded-2xl md:block animate-fade-in-up" style={{ animationDelay: "80ms" }}>        <div className="p-4">
          <h3 className="text-sm font-semibold text-[color:var(--fg)] mb-3">🔍 Bộ lọc</h3>
          <div className="grid gap-2 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Ngày</label>
              <Input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Vai trò</label>
              <Select value={role} onChange={(e) => setRole(e.target.value as "" | Role)}>
                <option value="">Tất cả</option>
                <option value="PAGE">Trực Page</option>
                <option value="TELESALES">Tư vấn viên</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Nhân sự</label>
              <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                <option value="">Tất cả</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name || owner.email}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Số bản ghi</label>
              <Select value={limit} onChange={(e) => setLimit(e.target.value)}>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 surface rounded-xl p-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="flex-1 space-y-2"><div className="h-4 w-1/4 rounded bg-[var(--bg-elevated)]" /><div className="h-3 w-1/3 rounded bg-[var(--bg-inset)]" /></div>
              <div className="h-6 w-16 rounded-full bg-[var(--bg-elevated)]" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Chưa có snapshot" description="Đợi n8n đẩy dữ liệu hoặc đổi bộ lọc." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <DataCard
              key={item.id}
              title={`${roleLabel(item.role)} · ${item.owner?.name || item.owner?.email || "Hệ thống"}`}
              subtitle={`${item.dateKey} · ${formatDateTimeVi(item.createdAt)}`}
              badge={<Badge text={item.computedJson?.status || "WARNING"} tone={statusTone(item.computedJson?.status)} />}
            >
              <div className="space-y-2">
                <p className="text-xs text-[color:var(--fg-muted)]">Chi nhánh: {item.branch ? `${item.branch.name}${item.branch.code ? ` (${item.branch.code})` : ""}` : "-"}</p>
                {item.role === "PAGE" ? (
                  <p className="text-xs text-[color:var(--fg)]">
                    Tin nhắn: {item.computedJson?.daily?.messagesToday ?? 0} • Data: {item.computedJson?.daily?.dataToday ?? 0} • %: {formatPct(item.computedJson?.daily?.dataRatePctDaily)} • Target: {formatPct(item.computedJson?.target?.dataRatePctTarget)} • Gap: {formatPct(item.computedJson?.gap?.dataRatePct)}
                  </p>
                ) : null}
                <p className="text-xs text-[color:var(--fg)]">{item.computedJson?.suggestions?.[0] || "Không có gợi ý"}</p>
                {Array.isArray(item.computedJson?.checklist) && item.computedJson.checklist.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-[color:var(--fg)]">
                    {item.computedJson.checklist.slice(0, 3).map((line, idx) => (
                      <li key={`${item.id}-${idx}`}>{line}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </DataCard>
          ))}
        </div>
      )}

      <MobileFiltersSheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        title="Bộ lọc snapshot"
        onApply={loadData}
        onReset={() => {
          setRole("");
          setOwnerId("");
          setDateKey(todayHcm());
          setLimit("50");
        }}
      >
        <div className="space-y-3">
          <Input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
          <Select value={role} onChange={(e) => setRole(e.target.value as "" | Role)}>
            <option value="">Tất cả vai trò</option>
            <option value="PAGE">Trực Page</option>
            <option value="TELESALES">Telesales</option>
          </Select>
          <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Tất cả nhân sự</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name || owner.email}
              </option>
            ))}
          </Select>
          <Select value={limit} onChange={(e) => setLimit(e.target.value)}>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>
      </MobileFiltersSheet>
    </div>
  );
}
