"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, fetchMe, getToken } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/admin-auth";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table } from "@/components/ui/table";
import { formatCurrencyVnd, formatDateVi } from "@/lib/date-utils";

type UserOption = { id: string; name: string | null; email: string };
type BranchOption = { id: string; name: string };
type SalaryProfile = {
  id: string;
  userId: string;
  branchId: string;
  roleTitle: string;
  baseSalaryVnd: number;
  allowanceVnd: number;
  standardDays: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  user: { id: string; name: string | null; email: string };
  branch: { id: string; name: string };
};

type ListResponse = { items: SalaryProfile[]; page: number; pageSize: number; total: number };

function formatApiError(err: ApiClientError) {
  return `${err.code}: ${err.message}`;
}

export default function SalaryProfilesPage() {
  const router = useRouter();
  const toast = useToast();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [items, setItems] = useState<SalaryProfile[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [roleTitle, setRoleTitle] = useState("Telesales");
  const [baseSalaryVnd, setBaseSalaryVnd] = useState("7000000");
  const [allowanceVnd, setAllowanceVnd] = useState("0");
  const [standardDays, setStandardDays] = useState("26");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));

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

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [profiles, usersRes, branchesRes] = await Promise.all([
        fetchJson<ListResponse>(`/api/admin/salary-profiles?page=${page}&pageSize=${pageSize}`, { token }),
        fetchJson<{ items: UserOption[] }>("/api/users?page=1&pageSize=200&isActive=true", { token }),
        fetchJson<{ items: BranchOption[] }>("/api/admin/branches", { token }),
      ]);
      setItems(profiles.items);
      setTotal(profiles.total);
      setUsers(usersRes.items);
      setBranches(branchesRes.items);
      if (!userId && usersRes.items.length > 0) setUserId(usersRes.items[0].id);
      if (!branchId && branchesRes.items.length > 0) setBranchId(branchesRes.items[0].id);
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [branchId, handleAuthError, page, pageSize, userId]);

  useEffect(() => {
    fetchMe()
      .then((data) => setIsAdmin(isAdminRole(data.user.role)))
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setCheckingRole(false));
  }, [router]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  async function createProfile() {
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      await fetchJson<{ profile: SalaryProfile }>("/api/admin/salary-profiles", {
        method: "POST",
        token,
        body: {
          userId,
          branchId,
          roleTitle,
          baseSalaryVnd: Number(baseSalaryVnd),
          allowanceVnd: Number(allowanceVnd),
          standardDays: Number(standardDays),
          effectiveFrom,
        },
      });
      toast.success("Đã tạo hồ sơ lương.");
      await load();
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingRole) {
    return <div className="flex items-center gap-2 text-[color:var(--fg)]"><Spinner /> Đang kiểm tra quyền...</div>;
  }

  if (!isAdmin) {
    return <Alert type="error" message="Bạn không có quyền truy cập." />;
  }

  return (
    <div className="space-y-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">💼</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Hồ sơ lương</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Quản lý mức lương cơ bản và phụ cấp theo nhân sự</p>
          </div>
          <Button variant="secondary" onClick={() => void load()} disabled={loading} >🔄 Làm mới</Button>
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}

      <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>        <div className="p-4">
          <h3 className="text-sm font-semibold text-[color:var(--fg)] mb-3">➕ Tạo hồ sơ lương</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1 text-sm text-[color:var(--fg)]">
              <span>Nhân sự</span>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm text-[color:var(--fg)]">
              <span>Chi nhánh</span>
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm text-[color:var(--fg)]">
              <span>Chức danh</span>
              <Input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm text-[color:var(--fg)]">
              <span>Lương cơ bản (VNĐ)</span>
              <Input type="number" min={0} value={baseSalaryVnd} onChange={(e) => setBaseSalaryVnd(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm text-[color:var(--fg)]">
              <span>Phụ cấp (VNĐ)</span>
              <Input type="number" min={0} value={allowanceVnd} onChange={(e) => setAllowanceVnd(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm text-[color:var(--fg)]">
              <span>Ngày công chuẩn</span>
              <Input type="number" min={1} value={standardDays} onChange={(e) => setStandardDays(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm text-[color:var(--fg)]">
              <span>Hiệu lực từ ngày</span>
              <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </label>
          </div>
          <div>
            <Button onClick={createProfile} disabled={submitting || !userId || !branchId}>Tạo hồ sơ</Button>
          </div>
        </div>
      </div>

      {
        loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 surface rounded-xl p-3">
                <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)]" />
                <div className="flex-1 space-y-2"><div className="h-4 w-1/4 rounded bg-[var(--bg-elevated)]" /><div className="h-3 w-1/2 rounded bg-[var(--bg-inset)]" /></div>
                <div className="h-6 w-20 rounded-full bg-[var(--bg-elevated)]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>
              <Table headers={["Nhân sự", "Chi nhánh", "Chức danh", "Lương cơ bản", "Phụ cấp", "Ngày công", "Hiệu lực"]}>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 30, 200)}ms` }}>
                    <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.user.name || item.user.email}</td>
                    <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.branch.name}</td>
                    <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.roleTitle}</td>
                    <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{formatCurrencyVnd(item.baseSalaryVnd)}</td>
                    <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{formatCurrencyVnd(item.allowanceVnd)}</td>
                    <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.standardDays}</td>
                    <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{formatDateVi(item.effectiveFrom)}</td>
                  </tr>
                ))}
              </Table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </>
        )
      }
    </div>
  );
}
