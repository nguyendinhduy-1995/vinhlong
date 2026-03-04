"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, fetchMe, getToken } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/admin-auth";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table } from "@/components/ui/table";
import { DataCard } from "@/components/mobile/DataCard";
import { formatDateVi } from "@/lib/date-utils";

type Role = "PAGE" | "TELESALES" | "BRANCH";

type UserOption = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
};

type EmployeeKpiSetting = {
  id: string;
  userId: string;
  role: Role;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  targetsJson: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  user: UserOption;
};

type ListResponse = {
  items: EmployeeKpiSetting[];
  page: number;
  pageSize: number;
  total: number;
};

type UsersResponse = {
  items: UserOption[];
};

type FormState = {
  userId: string;
  role: Role;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  dataRatePctTarget: string;
  calledPctGlobal: string;
  appointedPctGlobal: string;
  arrivedPctGlobal: string;
  signedPctGlobal: string;
};

const DEFAULT_FORM: FormState = {
  userId: "",
  role: "TELESALES",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
  isActive: true,
  dataRatePctTarget: "20",
  calledPctGlobal: "100",
  appointedPctGlobal: "80",
  arrivedPctGlobal: "80",
  signedPctGlobal: "100",
};

function parseApiError(err: ApiClientError) {
  return `${err.code}: ${err.message}`;
}

function statusBadge(active: boolean) {
  return active
    ? <Badge text="Đang áp dụng" tone="success" pulse />
    : <Badge text="Ngưng" tone="neutral" />;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; icon: string }> = {
  PAGE: { label: "Trực Page", color: "text-[color:var(--accent)]", bg: "bg-[var(--accent-bg)] border-[var(--border-subtle)]", icon: "📱" },
  TELESALES: { label: "Telesales", color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: "📞" },
  BRANCH: { label: "Chi nhánh", color: "text-[color:var(--warning-fg)]", bg: "bg-[var(--warning-bg)] border-[var(--border-subtle)]", icon: "🏢" },
};

function roleLabel(role: Role) {
  return ROLE_CONFIG[role]?.label ?? role;
}

function roleBadge(role: Role) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function summarizeTargets(role: Role, targets: Record<string, number>) {
  if (role === "PAGE") {
    const target = Number(targets.dataRatePctTarget ?? 0).toFixed(1);
    return `Mục tiêu % ra Data: ${target}%`;
  }
  if (role === "BRANCH") {
    return `Hồ sơ ký = Tin nhắn × KPI Page × KPI Telesale`;
  }
  return `Gọi ${targets.calledPctGlobal ?? 0}%/Data • Hẹn ${targets.appointedPctGlobal ?? 0}%/Gọi • Đến ${targets.arrivedPctGlobal ?? 0}%/Hẹn • Ký ${targets.signedPctGlobal ?? 0}%/Đến`;
}

function FunnelBar({ targets }: { targets: Record<string, number> }) {
  const steps = [
    { label: "Gọi", value: targets.calledPctGlobal ?? 0, color: "bg-[var(--accent-bg)]0" },
    { label: "Hẹn", value: targets.appointedPctGlobal ?? 0, color: "bg-[color:var(--accent)]" },
    { label: "Đến", value: targets.arrivedPctGlobal ?? 0, color: "bg-violet-500" },
    { label: "Ký", value: targets.signedPctGlobal ?? 0, color: "bg-[var(--success-bg)]0" },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, i) => (
        <div key={step.label} className="group relative flex items-center gap-1">
          {i > 0 && <span className="text-[color:var(--fg-faint)]">→</span>}
          <div className="flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5">
            <div className={`h-1.5 w-1.5 rounded-full ${step.color}`} />
            <span className="text-[11px] font-medium text-[color:var(--fg-secondary)]">{step.label}</span>
            <span className="text-[11px] font-bold text-[color:var(--fg)]">{step.value}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function toNumber(value: string) {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

/* ── Stat Card ─────────────────────────────────────────────── */

function StatCard({ label, value, icon, gradient, delay }: { label: string; value: number; icon: string; gradient: string; delay: string }) {
  return (
    <div className={`animate-fade-in-up card-hover ${delay} relative overflow-hidden glass-2 rounded-2xl p-5`}>
      <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full ${gradient} opacity-10`} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[color:var(--fg-muted)]">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[color:var(--fg)]">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${gradient} text-xl text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ── Loading Skeleton ──────────────────────────────────────── */

function TableSkeleton() {
  return (
    <div className="animate-fade-in space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 surface rounded-xl p-4">
          <div className="h-10 w-10 animate-shimmer rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-shimmer rounded-lg" />
            <div className="h-3 w-2/3 animate-shimmer rounded-lg" />
          </div>
          <div className="h-6 w-20 animate-shimmer rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ── Empty State ───────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="animate-fade-in-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-inset)] text-3xl">📊</div>
      <h3 className="mt-4 text-base font-semibold text-[color:var(--fg)]">Chưa có dữ liệu KPI</h3>
      <p className="mt-1.5 text-sm text-[color:var(--fg-muted)]">Tạo KPI nhân sự đầu tiên để bắt đầu theo dõi hiệu suất.</p>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function EmployeeKpiPage() {
  const router = useRouter();
  const toast = useToast();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [items, setItems] = useState<EmployeeKpiSetting[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [filterRole, setFilterRole] = useState<"" | Role>("");
  const [filterUserId, setFilterUserId] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeKpiSetting | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

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
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filterRole) params.set("role", filterRole);
    if (filterUserId) params.set("userId", filterUserId);
    if (filterActive) params.set("active", filterActive);
    return params.toString();
  }, [filterActive, filterRole, filterUserId, page, pageSize]);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token || !isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const [settingsRes, usersRes] = await Promise.all([
        fetchJson<ListResponse>(`/api/admin/employee-kpi?${query}`, { token }),
        fetchJson<UsersResponse>("/api/users?isActive=true&page=1&pageSize=200", { token }),
      ]);
      setItems(settingsRes.items);
      setPage(settingsRes.page);
      setPageSize(settingsRes.pageSize);
      setTotal(settingsRes.total);
      setUsers(usersRes.items.filter((item) => item.role === "telesales" || item.role === "direct_page" || item.role === "admin"));
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

  /* ── Stats ─────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active = items.filter((i) => i.isActive).length;
    return { total: items.length, active, inactive: items.length - active };
  }, [items]);

  function openCreateModal() {
    setEditTarget(null);
    setForm((current) => ({
      ...DEFAULT_FORM,
      userId: users[0]?.id ?? current.userId,
    }));
    setModalOpen(true);
  }

  function openEditModal(setting: EmployeeKpiSetting) {
    setEditTarget(setting);
    setForm({
      userId: setting.userId,
      role: setting.role,
      effectiveFrom: setting.effectiveFrom.slice(0, 10),
      effectiveTo: setting.effectiveTo ? setting.effectiveTo.slice(0, 10) : "",
      isActive: setting.isActive,
      dataRatePctTarget: String(setting.targetsJson.dataRatePctTarget ?? 20),
      calledPctGlobal: String(setting.targetsJson.calledPctGlobal ?? 100),
      appointedPctGlobal: String(setting.targetsJson.appointedPctGlobal ?? 80),
      arrivedPctGlobal: String(setting.targetsJson.arrivedPctGlobal ?? 80),
      signedPctGlobal: String(setting.targetsJson.signedPctGlobal ?? 100),
    });
    setModalOpen(true);
  }

  async function submitForm() {
    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    setError("");

    try {
      if (!form.userId) {
        setError("Vui lòng chọn nhân viên.");
        return;
      }

      let targetsJson: Record<string, number>;
      if (form.role === "PAGE") {
        const dataRatePctTarget = toNumber(form.dataRatePctTarget);
        if (dataRatePctTarget === undefined || dataRatePctTarget < 0 || dataRatePctTarget > 100) {
          setError("Mục tiêu % ra Data phải từ 0 đến 100.");
          return;
        }
        targetsJson = {
          dataRatePctTarget: Math.round(dataRatePctTarget * 10) / 10,
        };
      } else if (form.role === "BRANCH") {
        targetsJson = { branchFormula: 1 };
      } else {
        targetsJson = {};
        const entries: Array<[string, number | undefined]> = [
          ["calledPctGlobal", toNumber(form.calledPctGlobal)],
          ["appointedPctGlobal", toNumber(form.appointedPctGlobal)],
          ["arrivedPctGlobal", toNumber(form.arrivedPctGlobal)],
          ["signedPctGlobal", toNumber(form.signedPctGlobal)],
        ];
        for (const [key, value] of entries) {
          if (value !== undefined) targetsJson[key] = value;
        }
        if (Object.keys(targetsJson).length === 0) {
          setError("Telesales cần ít nhất 1 chỉ tiêu %.");
          return;
        }
      }

      const body = {
        userId: form.userId,
        role: form.role,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        isActive: form.isActive,
        targetsJson,
      };

      if (editTarget) {
        await fetchJson<{ setting: EmployeeKpiSetting }>(`/api/admin/employee-kpi/${editTarget.id}`, {
          method: "PATCH",
          token,
          body,
        });
        toast.success("Đã cập nhật KPI nhân sự thành công! ✅");
      } else {
        await fetchJson<{ setting: EmployeeKpiSetting }>("/api/admin/employee-kpi", {
          method: "POST",
          token,
          body,
        });
        toast.success("Đã tạo KPI nhân sự thành công! 🎉");
      }

      setModalOpen(false);
      await loadData();
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-fade-in-up flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-[color:var(--fg-muted)]">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Alert type="error" message="Bạn không có quyền truy cập trang này." />;
  }

  return (
    <div className="space-y-5">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">📊</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>KPI nhân sự</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Thiết lập KPI theo nhân viên và thời gian hiệu lực</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => void loadData()} disabled={loading} >
              {loading ? "Đang tải..." : "🔄 Làm mới"}
            </Button>
            <Button variant="accent" onClick={openCreateModal} >✨ Tạo KPI</Button>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {error ? <div className="animate-scale-in"><Alert type="error" message={error} /></div> : null}

      {/* Stats Row */}
      {!loading && items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Tổng KPI" value={stats.total} icon="📋" gradient="gradient-blue" delay="delay-1" />
          <StatCard label="Đang áp dụng" value={stats.active} icon="✅" gradient="gradient-emerald" delay="delay-2" />
          <StatCard label="Ngưng áp dụng" value={stats.inactive} icon="⏸️" gradient="gradient-amber" delay="delay-3" />
        </div>
      )}

      {/* Filters */}
      <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>        <div className="p-4">
          <h3 className="text-sm font-semibold text-[color:var(--fg)] mb-3">🔍 Bộ lọc</h3>
          <div className="grid gap-3 md:grid-cols-5">
            <label className="space-y-1.5 text-sm text-[color:var(--fg-secondary)]">
              <span className="font-medium">Nhân viên</span>
              <Select value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}>
                <option value="">Tất cả</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1.5 text-sm text-[color:var(--fg-secondary)]">
              <span className="font-medium">Vai trò KPI</span>
              <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value as "" | Role)}>
                <option value="">Tất cả</option>
                <option value="PAGE">📱 Trực Page</option>
                <option value="TELESALES">📞 Telesales</option>
                <option value="BRANCH">🏢 Chi nhánh</option>
              </Select>
            </label>
            <label className="space-y-1.5 text-sm text-[color:var(--fg-secondary)]">
              <span className="font-medium">Trạng thái</span>
              <Select value={filterActive} onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}>
                <option value="">Tất cả</option>
                <option value="true">✅ Đang áp dụng</option>
                <option value="false">⏸️ Ngưng áp dụng</option>
              </Select>
            </label>
            <label className="space-y-1.5 text-sm text-[color:var(--fg-secondary)]">
              <span className="font-medium">Kích thước</span>
              <Select
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </label>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setPage(1);
                  void loadData();
                }}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {loading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="animate-fade-in-up delay-3">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table headers={["Nhân viên", "Vai trò", "Chỉ tiêu KPI", "Hiệu lực", "Trạng thái", ""]}>
              {items.map((item, index) => (
                <tr key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 40}ms` }}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-zinc-100 text-sm font-bold text-[color:var(--fg-secondary)]">
                        {(item.user.name || item.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[color:var(--fg)]">{item.user.name || item.user.email}</div>
                        <div className="text-xs text-[color:var(--fg-muted)]">{item.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{roleBadge(item.role)}</td>
                  <td className="px-4 py-3.5">
                    {item.role === "TELESALES" ? (
                      <FunnelBar targets={item.targetsJson} />
                    ) : (
                      <span className="text-sm text-[color:var(--fg-secondary)]">{summarizeTargets(item.role, item.targetsJson)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm text-[color:var(--fg)]">
                      {formatDateVi(item.effectiveFrom)}
                    </div>
                    <div className="text-xs text-[color:var(--fg-muted)]">
                      → {item.effectiveTo ? formatDateVi(item.effectiveTo) : "Không giới hạn"}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{statusBadge(item.isActive)}</td>
                  <td className="px-4 py-3.5">
                    <Button variant="ghost" onClick={() => openEditModal(item)} className="text-[color:var(--accent)] hover:text-[color:var(--accent-hover)] hover:bg-[var(--accent-bg)]">
                      ✏️ Sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {items.map((item, index) => (
              <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 60}ms` }}>
                <DataCard
                  title={item.user.name || item.user.email}
                  subtitle={`${roleLabel(item.role)} • ${formatDateVi(item.effectiveFrom)}`}
                  badge={statusBadge(item.isActive)}
                  footer={
                    <Button variant="ghost" onClick={() => openEditModal(item)} className="text-[color:var(--accent)]">
                      ✏️ Sửa
                    </Button>
                  }
                >
                  <div className="space-y-1.5 text-xs">
                    {item.role === "TELESALES" ? (
                      <FunnelBar targets={item.targetsJson} />
                    ) : (
                      <p className="text-[color:var(--fg-secondary)]">{summarizeTargets(item.role, item.targetsJson)}</p>
                    )}
                    <p className="text-[color:var(--fg-muted)]">
                      Hiệu lực đến: {item.effectiveTo ? formatDateVi(item.effectiveTo) : "Không giới hạn"}
                    </p>
                  </div>
                </DataCard>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(next) => setPage(next)}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        title={editTarget ? "Cập nhật KPI nhân sự" : "Tạo KPI nhân sự"}
        description="Thiết lập KPI theo vai trò và khoảng thời gian hiệu lực"
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm text-[color:var(--fg-secondary)]">
              <span className="font-medium text-[color:var(--fg)]">Nhân viên</span>
              <Select value={form.userId} onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}>
                <option value="">Chọn nhân viên</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-1.5 text-sm text-[color:var(--fg-secondary)]">
              <span className="font-medium text-[color:var(--fg)]">Vai trò KPI</span>
              <Select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}>
                <option value="PAGE">📱 Trực Page</option>
                <option value="TELESALES">📞 Telesales</option>
                <option value="BRANCH">🏢 Chi nhánh</option>
              </Select>
            </label>

            <label className="space-y-1.5 text-sm text-[color:var(--fg-secondary)]">
              <span className="font-medium text-[color:var(--fg)]">Hiệu lực từ ngày</span>
              <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))} />
            </label>

            <label className="space-y-1.5 text-sm text-[color:var(--fg-secondary)]">
              <span className="font-medium text-[color:var(--fg)]">Hiệu lực đến ngày</span>
              <Input type="date" value={form.effectiveTo} onChange={(e) => setForm((prev) => ({ ...prev, effectiveTo: e.target.value }))} />
            </label>

            <label className="flex items-center gap-3 text-sm text-[color:var(--fg)] md:col-span-2">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="peer h-5 w-5 rounded-md border-[var(--border-subtle)] text-[color:var(--accent)] transition focus:ring-[var(--accent)]"
                />
              </div>
              <span className="font-medium">Đang áp dụng</span>
            </label>
          </div>

          {/* Role-specific fields */}
          {form.role === "PAGE" ? (
            <div className="animate-fade-in-up rounded-xl border border-[var(--border-subtle)] bg-[var(--accent-bg)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-base">📱</span>
                <div>
                  <p className="text-sm font-semibold text-blue-900">KPI Trực Page</p>
                  <p className="text-xs text-[color:var(--accent)]">% = Data / Tin nhắn × 100</p>
                </div>
              </div>
              <label className="space-y-1.5 text-sm text-[color:var(--fg)]">
                <span className="font-medium">Mục tiêu % ra Data</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  placeholder="20"
                  value={form.dataRatePctTarget}
                  onChange={(e) => setForm((prev) => ({ ...prev, dataRatePctTarget: e.target.value }))}
                />
              </label>
            </div>
          ) : form.role === "BRANCH" ? (
            <div className="animate-fade-in-up rounded-xl border border-[var(--border-subtle)] bg-gradient-to-br from-amber-50 to-orange-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-base">🏢</span>
                <p className="text-sm font-semibold text-amber-900">Công thức KPI Chi nhánh</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-[var(--card-bg)] p-3">
                <p className="text-sm font-mono text-[color:var(--fg)]">
                  Số hồ sơ ký = Tổng tin nhắn × KPI trực Page × KPI Telesale
                </p>
              </div>
              <p className="mt-2.5 text-xs text-[color:var(--warning-fg)]">
                KPI chi nhánh được tính tự động dựa trên KPI của trực Page và Telesale đang áp dụng.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in-up space-y-4">
              <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-base">📞</span>
                  <div>
                    <p className="text-sm font-semibold text-violet-900">KPI Telesales — Funnel tháng</p>
                    <p className="text-xs text-violet-600">MTD: Tính từ ngày 01 đến hiện tại, tự reset đầu tháng</p>
                  </div>
                </div>

                {/* Funnel visualization */}
                <div className="mb-4 flex items-center justify-center gap-2">
                  {[
                    { label: "Data", color: "bg-[var(--bg-elevated)]0" },
                    { label: "Gọi", color: "bg-[var(--accent-bg)]0" },
                    { label: "Hẹn", color: "bg-[color:var(--accent)]" },
                    { label: "Đến", color: "bg-violet-500" },
                    { label: "Ký", color: "bg-[var(--success-bg)]0" },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2">
                      {i > 0 && <span className="text-sm text-[color:var(--fg-faint)]">→</span>}
                      <div className="flex items-center gap-1.5 rounded-full bg-[var(--card-bg)] px-2.5 py-1 shadow-sm border border-[var(--border-hairline)]">
                        <div className={`h-2 w-2 rounded-full ${step.color}`} />
                        <span className="text-xs font-medium text-[color:var(--fg)]">{step.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm text-[color:var(--fg)]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-[var(--accent-bg)]0" />
                      Gọi (% trên Data tháng)
                    </span>
                    <Input
                      value={form.calledPctGlobal}
                      onChange={(e) => setForm((prev) => ({ ...prev, calledPctGlobal: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm text-[color:var(--fg)]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                      Hẹn (% trên Gọi tháng)
                    </span>
                    <Input
                      value={form.appointedPctGlobal}
                      onChange={(e) => setForm((prev) => ({ ...prev, appointedPctGlobal: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm text-[color:var(--fg)]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-violet-500" />
                      Đến (% trên Hẹn tháng)
                    </span>
                    <Input
                      value={form.arrivedPctGlobal}
                      onChange={(e) => setForm((prev) => ({ ...prev, arrivedPctGlobal: e.target.value }))}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm text-[color:var(--fg)]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-[var(--success-bg)]0" />
                      Ký (% trên Đến tháng)
                    </span>
                    <Input
                      value={form.signedPctGlobal}
                      onChange={(e) => setForm((prev) => ({ ...prev, signedPctGlobal: e.target.value }))}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-[var(--border-hairline)] pt-4">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="accent" onClick={() => void submitForm()} disabled={submitting}>
              {submitting ? "Đang lưu..." : editTarget ? "💾 Cập nhật" : "✨ Tạo mới"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
