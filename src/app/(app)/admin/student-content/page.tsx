"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, getToken } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { formatDateVi } from "@/lib/date-utils";

type Item = {
  id: string;
  category: "HUONG_DAN" | "MEO_HOC" | "HO_SO" | "THI";
  title: string;
  body: string;
  isPublished: boolean;
  createdAt: string;
};

type ListResponse = {
  items: Item[];
  page: number;
  pageSize: number;
  total: number;
};

function categoryLabel(value: Item["category"]) {
  if (value === "HUONG_DAN") return "Hướng dẫn";
  if (value === "MEO_HOC") return "Mẹo học";
  if (value === "HO_SO") return "Hồ sơ";
  return "Thi";
}

export default function AdminStudentContentPage() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [isPublished, setIsPublished] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ category: "HUONG_DAN", title: "", body: "", isPublished: false });

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (q.trim()) p.set("q", q.trim());
    if (category) p.set("category", category);
    if (isPublished) p.set("isPublished", isPublished);
    return p.toString();
  }, [category, isPublished, page, pageSize, q]);

  /* debounce search input */
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  const handleAuthError = useCallback((err: ApiClientError) => {
    if (err.code === "AUTH_MISSING_BEARER" || err.code === "AUTH_INVALID_TOKEN") {
      clearToken();
      router.replace("/login");
      return true;
    }
    return false;
  }, [router]);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson<ListResponse>(`/api/admin/student-content?${query}`, { token });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    const token = getToken();
    if (!token) return;
    setError("");
    try {
      if (editing) {
        await fetchJson(`/api/admin/student-content/${editing.id}`, {
          method: "PATCH",
          token,
          body: form,
        });
        toast.success("Đã cập nhật nội dung.");
      } else {
        await fetchJson("/api/admin/student-content", {
          method: "POST",
          token,
          body: form,
        });
        toast.success("Đã tạo nội dung.");
      }
      setOpenForm(false);
      setEditing(null);
      setForm({ category: "HUONG_DAN", title: "", body: "", isPublished: false });
      await load();
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">📚</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Quản trị nội dung học viên</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Hướng dẫn, mẹo học, hồ sơ, thi</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={load} disabled={loading} >
              {loading ? "Đang tải..." : "🔄 Làm mới"}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setForm({ category: "HUONG_DAN", title: "", body: "", isPublished: false });
                setOpenForm(true);
              }}
              
            >
              ➕ Tạo nội dung
            </Button>
          </div>
        </div>
      </div>
      {error ? <Alert type="error" message={error} /> : null}

      <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>        <div className="p-4">
          <h3 className="text-sm font-semibold text-[color:var(--fg)] mb-3">🔍 Bộ lọc</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Tìm tiêu đề/nội dung" />
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">Tất cả danh mục</option>
              <option value="HUONG_DAN">Hướng dẫn</option>
              <option value="MEO_HOC">Mẹo học</option>
              <option value="HO_SO">Hồ sơ</option>
              <option value="THI">Thi</option>
            </Select>
            <Select value={isPublished} onChange={(e) => { setIsPublished(e.target.value); setPage(1); }}>
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đã xuất bản</option>
              <option value="false">Nháp</option>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 surface rounded-xl p-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="flex-1 space-y-2"><div className="h-4 w-1/3 rounded bg-[var(--bg-elevated)]" /><div className="h-3 w-1/4 rounded bg-[var(--bg-inset)]" /></div>
              <div className="h-6 w-16 rounded-full bg-[var(--bg-elevated)]" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-[var(--card-bg)] p-6 text-sm text-[color:var(--fg-secondary)] shadow-sm">Không có dữ liệu.</div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>
            <Table headers={["Tiêu đề", "Danh mục", "Trạng thái", "Ngày tạo", "Hành động"]}>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 30, 200)}ms` }}>
                  <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.title}</td>
                  <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{categoryLabel(item.category)}</td>
                  <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.isPublished ? "Đã xuất bản" : "Nháp"}</td>
                  <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{formatDateVi(item.createdAt)}</td>
                  <td className="px-3 py-2">
                    <Button
                      variant="secondary"
                      className="h-7 px-2 py-1 text-xs"
                      onClick={() => {
                        setEditing(item);
                        setForm({
                          category: item.category,
                          title: item.title,
                          body: item.body,
                          isPublished: item.isPublished,
                        });
                        setOpenForm(true);
                      }}
                    >
                      Sửa
                    </Button>
                  </td>
                </tr>
              ))}
            </Table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        </div>
      )}

      <Modal open={openForm} title={editing ? "Cập nhật nội dung" : "Tạo nội dung"} onClose={() => setOpenForm(false)}>
        <div className="space-y-3">
          <Select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Item["category"] }))}>
            <option value="HUONG_DAN">Hướng dẫn</option>
            <option value="MEO_HOC">Mẹo học</option>
            <option value="HO_SO">Hồ sơ</option>
            <option value="THI">Thi</option>
          </Select>
          <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Tiêu đề" />
          <textarea
            className="w-full rounded-2xl border border-[var(--border-subtle)] px-3 py-2 text-sm"
            rows={8}
            value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            placeholder="Nội dung"
          />
          <label className="flex items-center gap-2 text-sm text-[color:var(--fg)]">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
            Xuất bản
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenForm(false)}>Hủy</Button>
            <Button onClick={save}>Lưu</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
