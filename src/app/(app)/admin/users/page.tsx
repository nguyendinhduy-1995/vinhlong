"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { EmptyState } from "@/components/mobile/EmptyState";
import { MobileToolbar } from "@/components/app/mobile-toolbar";
import { MobileFiltersSheet } from "@/components/mobile/MobileFiltersSheet";
import { formatDateTimeVi } from "@/lib/date-utils";

type Role = "admin" | "manager" | "telesales" | "direct_page" | "viewer";
type BranchOption = {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
};

type UserItem = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  branchId: string | null;
  branch?: BranchOption | null;
  createdAt: string;
  updatedAt: string;
};

type UserListResponse = {
  items: UserItem[];
  page: number;
  pageSize: number;
  total: number;
};

type BranchListResponse = {
  items: BranchOption[];
};

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: "admin", label: "Quản trị" },
  { value: "manager", label: "Quản lý" },
  { value: "telesales", label: "Telesale" },
  { value: "direct_page", label: "Trực page" },
  { value: "viewer", label: "Chỉ xem" },
];

function roleLabel(role: Role) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label || role;
}

function parseApiError(error: ApiClientError) {
  return `${error.code}: ${error.message}`;
}

function branchLabel(branch: BranchOption | null | undefined) {
  if (!branch) return "-";
  return branch.code ? `${branch.name} (${branch.code})` : branch.name;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const toast = useToast();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [items, setItems] = useState<UserItem[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | Role>("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [branchFilter, setBranchFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as Role,
    isActive: true,
    branchId: "",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "viewer" as Role,
    isActive: true,
    password: "",
    branchId: "",
  });

  const [toggleTarget, setToggleTarget] = useState<UserItem | null>(null);
  const [toggleSaving, setToggleSaving] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (q.trim()) params.set("q", q.trim());
    if (roleFilter) params.set("role", roleFilter);
    if (activeFilter) params.set("isActive", activeFilter);
    if (branchFilter) params.set("branchId", branchFilter);
    return params.toString();
  }, [activeFilter, branchFilter, page, pageSize, q, roleFilter]);

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
      .then((data) => {
        const ok = isAdminRole(data.user.role);
        setIsAdmin(ok);
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      })
      .finally(() => setCheckingRole(false));
  }, [router]);

  const loadBranches = useCallback(async () => {
    const token = getToken();
    if (!token || !isAdmin) return;
    try {
      const data = await fetchJson<BranchListResponse>("/api/admin/branches?page=1&pageSize=200", { token });
      setBranches(data.items || []);
    } catch {
      setBranches([]);
    }
  }, [isAdmin]);

  const loadUsers = useCallback(async () => {
    const token = getToken();
    if (!token || !isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson<UserListResponse>(`/api/users?${query}`, { token });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`Có lỗi xảy ra: ${parseApiError(err)}`);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, isAdmin, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin, loadUsers]);

  useEffect(() => {
    if (!isAdmin) return;
    loadBranches();
  }, [isAdmin, loadBranches]);

  async function createUser() {
    const token = getToken();
    if (!token) return;
    if (!createForm.email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (createForm.password.length < 8) {
      setError("Mật khẩu cần tối thiểu 8 ký tự.");
      return;
    }

    setCreateSaving(true);
    setError("");
    try {
      await fetchJson<{ user: UserItem }>("/api/users", {
        method: "POST",
        token,
        body: {
          name: createForm.name || null,
          email: createForm.email.trim(),
          password: createForm.password,
          role: createForm.role,
          isActive: createForm.isActive,
          branchId: createForm.branchId || null,
        },
      });
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "viewer", isActive: true, branchId: "" });
      toast.success("Tạo người dùng thành công.");
      await loadUsers();
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`Không thể tạo người dùng: ${parseApiError(err)}`);
    } finally {
      setCreateSaving(false);
    }
  }

  function openEdit(user: UserItem) {
    setEditTarget(user);
    setEditForm({
      name: user.name || "",
      role: user.role,
      isActive: user.isActive,
      password: "",
      branchId: user.branchId || "",
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    const token = getToken();
    if (!token || !editTarget) return;
    if (editForm.password && editForm.password.length < 8) {
      setError("Mật khẩu mới cần tối thiểu 8 ký tự.");
      return;
    }

    setEditSaving(true);
    setError("");
    try {
      await fetchJson<{ user: UserItem }>(`/api/users/${editTarget.id}`, {
        method: "PATCH",
        token,
        body: {
          name: editForm.name || null,
          role: editForm.role,
          isActive: editForm.isActive,
          branchId: editForm.branchId || null,
          ...(editForm.password ? { password: editForm.password } : {}),
        },
      });
      setEditOpen(false);
      setEditTarget(null);
      toast.success("Cập nhật người dùng thành công.");
      await loadUsers();
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`Không thể cập nhật người dùng: ${parseApiError(err)}`);
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmToggleActive() {
    const token = getToken();
    if (!token || !toggleTarget) return;
    setToggleSaving(true);
    setError("");
    try {
      await fetchJson<{ user: UserItem }>(`/api/users/${toggleTarget.id}`, {
        method: "PATCH",
        token,
        body: {
          isActive: !toggleTarget.isActive,
        },
      });
      setToggleTarget(null);
      toast.success(!toggleTarget.isActive ? "Đã mở khóa người dùng." : "Đã khóa người dùng.");
      await loadUsers();
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`Không thể cập nhật trạng thái: ${parseApiError(err)}`);
    } finally {
      setToggleSaving(false);
    }
  }

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
        <Link href="/leads" className="inline-block rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[color:var(--fg)]">
          Quay về Khách hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">👥</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Quản trị người dùng</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Quản lý tài khoản và chi nhánh</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={loadUsers} disabled={loading} >
              {loading ? "Đang tải..." : "🔄 Làm mới"}
            </Button>
            <Button onClick={() => setCreateOpen(true)} >➕ Tạo người dùng</Button>
          </div>
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}

      <div className="sticky top-[116px] z-20 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/90 p-2 backdrop-blur md:hidden">
        <MobileToolbar
          value={qInput}
          onChange={setQInput}
          onOpenFilter={() => setMobileFilterOpen(true)}
          activeFilterCount={(q ? 1 : 0) + (roleFilter ? 1 : 0) + (activeFilter ? 1 : 0) + (branchFilter ? 1 : 0)}
          quickActions={
            <>
              <Button variant="secondary" onClick={loadUsers}>
                Làm mới
              </Button>
              <Button onClick={() => setCreateOpen(true)}>Tạo người dùng</Button>
            </>
          }
        />
      </div>

      <div className="hidden overflow-hidden glass-2 rounded-2xl md:block animate-fade-in-up" style={{ animationDelay: "80ms" }}>        <div className="p-4">
          <h3 className="text-sm font-semibold text-[color:var(--fg)] mb-3">🔍 Bộ lọc</h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Tìm kiếm</label>
              <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Tên hoặc email" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Vai trò</label>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setPage(1);
                  setRoleFilter(e.target.value as "" | Role);
                }}
              >
                <option value="">Tất cả vai trò</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Chi nhánh</label>
              <Select
                value={branchFilter}
                onChange={(e) => {
                  setPage(1);
                  setBranchFilter(e.target.value);
                }}
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branchLabel(branch)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Trạng thái</label>
              <Select
                value={activeFilter}
                onChange={(e) => {
                  setPage(1);
                  setActiveFilter(e.target.value as "" | "true" | "false");
                }}
              >
                <option value="">Tất cả</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Đã khóa</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Kích thước trang</label>
              <Select
                value={String(pageSize)}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {loading ? (
          <div className="surface rounded-2xl px-3 py-6 text-center text-sm text-[color:var(--fg-secondary)]">Đang tải danh sách người dùng...</div>
        ) : items.length === 0 ? (
          <EmptyState title="Không có người dùng" description="Hãy thay đổi bộ lọc hoặc tạo mới người dùng." />
        ) : (
          items.map((user) => (
            <DataCard
              key={user.id}
              title={user.name || user.email}
              subtitle={user.email}
              badge={<Badge text={user.isActive ? "Đang hoạt động" : "Đã khóa"} />}
              footer={
                <div className="flex w-full items-center gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => openEdit(user)}>
                    Sửa
                  </Button>
                  <Button
                    variant={user.isActive ? "danger" : "secondary"}
                    className="flex-1"
                    onClick={() => setToggleTarget(user)}
                  >
                    {user.isActive ? "Khóa" : "Mở khóa"}
                  </Button>
                </div>
              }
            >
              <div className="space-y-1 text-xs">
                <p>
                  <span className="text-[color:var(--fg-muted)]">Vai trò:</span> {roleLabel(user.role)}
                </p>
                <p>
                  <span className="text-[color:var(--fg-muted)]">Chi nhánh:</span> {branchLabel(user.branch)}
                </p>
                <p>
                  <span className="text-[color:var(--fg-muted)]">Tạo lúc:</span> {formatDateTimeVi(user.createdAt)}
                </p>
              </div>
            </DataCard>
          ))
        )}
      </div>

      <div className="hidden md:block">
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
          <div className="rounded-xl bg-[var(--card-bg)] p-6 text-sm text-[color:var(--fg-secondary)]">Không có dữ liệu người dùng.</div>
        ) : (
          <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>
            <Table headers={["Tên", "Email", "Vai trò", "Chi nhánh", "Trạng thái", "Ngày tạo", "Hành động"]}>
              {items.map((user, idx) => (
                <tr key={user.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 30, 200)}ms` }}>
                  <td className="px-3 py-2">{user.name || "-"}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    <Badge text={roleLabel(user.role)} />
                  </td>
                  <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{branchLabel(user.branch)}</td>
                  <td className="px-3 py-2">
                    <Badge text={user.isActive ? "Đang hoạt động" : "Đã khóa"} />
                  </td>
                  <td className="px-3 py-2 text-sm text-[color:var(--fg-secondary)]">{formatDateTimeVi(user.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="secondary" className="h-7 px-2 py-1 text-xs" onClick={() => openEdit(user)}>
                        Sửa
                      </Button>
                      <Button
                        variant={user.isActive ? "danger" : "secondary"}
                        className="h-7 px-2 py-1 text-xs"
                        onClick={() => setToggleTarget(user)}
                      >
                        {user.isActive ? "Khóa" : "Mở khóa"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <MobileFiltersSheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        title="Bộ lọc người dùng"
        onApply={() => setPage(1)}
        onReset={() => {
          setQInput("");
          setQ("");
          setRoleFilter("");
          setActiveFilter("");
          setBranchFilter("");
          setPage(1);
        }}
      >
        <div className="space-y-3">
          <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Tên hoặc email" />
          <Select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value as "" | Role);
            }}
          >
            <option value="">Tất cả vai trò</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
          <Select
            value={branchFilter}
            onChange={(e) => {
              setPage(1);
              setBranchFilter(e.target.value);
            }}
          >
            <option value="">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branchLabel(branch)}
              </option>
            ))}
          </Select>
          <Select
            value={activeFilter}
            onChange={(e) => {
              setPage(1);
              setActiveFilter(e.target.value as "" | "true" | "false");
            }}
          >
            <option value="">Tất cả</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã khóa</option>
          </Select>
          <Select
            value={String(pageSize)}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>
      </MobileFiltersSheet>

      <Modal open={createOpen} title="Tạo người dùng" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Họ tên</label>
            <Input value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Email *</label>
            <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Mật khẩu *</label>
            <Input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
              placeholder="Tối thiểu 8 ký tự"
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Vai trò</label>
              <Select
                value={createForm.role}
                onChange={(e) => setCreateForm((s) => ({ ...s, role: e.target.value as Role }))}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Chi nhánh</label>
              <Select value={createForm.branchId} onChange={(e) => setCreateForm((s) => ({ ...s, branchId: e.target.value }))}>
                <option value="">Không chọn</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branchLabel(branch)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Trạng thái</label>
            <Select
              value={createForm.isActive ? "true" : "false"}
              onChange={(e) => setCreateForm((s) => ({ ...s, isActive: e.target.value === "true" }))}
            >
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã khóa</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={createUser} disabled={createSaving}>
              {createSaving ? "Đang tạo..." : "Tạo người dùng"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} title="Sửa người dùng" onClose={() => setEditOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Họ tên</label>
            <Input value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Vai trò</label>
              <Select value={editForm.role} onChange={(e) => setEditForm((s) => ({ ...s, role: e.target.value as Role }))}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Chi nhánh</label>
              <Select value={editForm.branchId} onChange={(e) => setEditForm((s) => ({ ...s, branchId: e.target.value }))}>
                <option value="">Không chọn</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branchLabel(branch)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Trạng thái</label>
            <Select
              value={editForm.isActive ? "true" : "false"}
              onChange={(e) => setEditForm((s) => ({ ...s, isActive: e.target.value === "true" }))}
            >
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã khóa</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Đặt lại mật khẩu (không bắt buộc)</label>
            <Input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm((s) => ({ ...s, password: e.target.value }))}
              placeholder="Để trống nếu không đổi"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(toggleTarget)}
        title={toggleTarget?.isActive ? "Xác nhận khóa người dùng" : "Xác nhận mở khóa người dùng"}
        onClose={() => setToggleTarget(null)}
      >
        <p className="text-sm text-[color:var(--fg)]">
          {toggleTarget?.isActive
            ? "Bạn có chắc muốn khóa người dùng này?"
            : "Bạn có chắc muốn mở khóa người dùng này?"}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setToggleTarget(null)}>
            Huỷ
          </Button>
          <Button onClick={confirmToggleActive} disabled={toggleSaving}>
            {toggleSaving ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
