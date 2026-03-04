"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { MobileShell } from "@/components/mobile/MobileShell";
import { clearToken, getToken } from "@/lib/auth-client";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { todayInHoChiMinh } from "@/lib/date-utils";

type Branch = { id: string; name: string };
type GoalItem = {
  id: string;
  branchId: string | null;
  periodType: "DAILY" | "MONTHLY";
  dateKey: string | null;
  monthKey: string | null;
  revenueTarget: number;
  dossierTarget: number;
  costTarget: number;
  note: string | null;
  branch?: { id: string; name: string } | null;
};

function errText(error: unknown) {
  const e = error as ApiClientError;
  return `${e.code || "INTERNAL_ERROR"}: ${e.message || "Lỗi không xác định"}`;
}

export default function GoalsPage() {
  const router = useRouter();
  const today = todayInHoChiMinh();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [periodType, setPeriodType] = useState<"DAILY" | "MONTHLY">("DAILY");
  const [dateKey, setDateKey] = useState(today);
  const [monthKey, setMonthKey] = useState(today.slice(0, 7));
  const [branchId, setBranchId] = useState("");
  const [revenueTarget, setRevenueTarget] = useState("0");
  const [dossierTarget, setDossierTarget] = useState("0");
  const [costTarget, setCostTarget] = useState("0");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadBranches = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await fetchJson<{ items: Branch[] }>("/api/admin/branches", { token }).catch(() => ({ items: [] }));
    setBranches(Array.isArray(data.items) ? data.items : []);
    if (!branchId && data.items?.[0]?.id) setBranchId(data.items[0].id);
  }, [branchId]);

  const loadGoals = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ periodType });
      if (periodType === "DAILY") params.set("dateKey", dateKey);
      if (periodType === "MONTHLY") params.set("monthKey", monthKey);
      if (branchId) params.set("branchId", branchId);
      const data = await fetchJson<{ items: GoalItem[] }>(`/api/goals?${params.toString()}`, { token });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      const err = e as ApiClientError;
      if (err.code === "AUTH_MISSING_BEARER" || err.code === "AUTH_INVALID_TOKEN") {
        clearToken();
        router.replace("/login");
        return;
      }
      setError(`Lỗi tải mục tiêu: ${errText(e)}`);
    } finally {
      setLoading(false);
    }
  }, [branchId, dateKey, monthKey, periodType, router]);

  useEffect(() => {
    loadBranches().then(() => loadGoals());
  }, [loadBranches, loadGoals]);

  async function saveGoal() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      await fetchJson("/api/goals", {
        method: "POST",
        token,
        body: {
          periodType,
          branchId: branchId || null,
          dateKey: periodType === "DAILY" ? dateKey : undefined,
          monthKey: periodType === "MONTHLY" ? monthKey : undefined,
          revenueTarget: Number(revenueTarget || 0),
          dossierTarget: Number(dossierTarget || 0),
          costTarget: Number(costTarget || 0),
          note,
        },
      });
      await loadGoals();
    } catch (e) {
      setError(`Lỗi lưu mục tiêu: ${errText(e)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileShell title="Mục tiêu ngày/tháng" subtitle="Thiết lập doanh thu, hồ sơ, chi phí">
      <div className="space-y-4 py-3">
        {error ? <Alert type="error" message={error} /> : null}

        {/* ── Premium Header ── */}
        <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">📈</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Mục tiêu & Kế hoạch</h2>
              <p className="text-sm text-[color:var(--fg-muted)]">Thiết lập doanh thu, hồ sơ & chi phí theo ngày/tháng</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-sm font-bold backdrop-blur-sm">
              📊 {items.length}
            </span>
          </div>
        </div>

        <section className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>          <div className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[color:var(--fg)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs text-white">➕</span>
              Thiết lập mục tiêu
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-[color:var(--fg-muted)]">Kỳ mục tiêu</p>
                <select value={periodType} onChange={(e) => setPeriodType(e.target.value as "DAILY" | "MONTHLY")} className="h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                  <option value="DAILY">Ngày</option>
                  <option value="MONTHLY">Tháng</option>
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs text-[color:var(--fg-muted)]">Chi nhánh</p>
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm">
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-xs text-[color:var(--fg-muted)]">Ngày/Tháng</p>
                {periodType === "DAILY" ? (
                  <Input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
                ) : (
                  <Input type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
                )}
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs text-[color:var(--fg-muted)]">Mục tiêu doanh thu</p>
                <Input type="number" value={revenueTarget} onChange={(e) => setRevenueTarget(e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-xs text-[color:var(--fg-muted)]">Mục tiêu hồ sơ</p>
                <Input type="number" value={dossierTarget} onChange={(e) => setDossierTarget(e.target.value)} />
              </div>
              <div>
                <p className="mb-1 text-xs text-[color:var(--fg-muted)]">Mục tiêu chi phí</p>
                <Input type="number" value={costTarget} onChange={(e) => setCostTarget(e.target.value)} />
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-xs text-[color:var(--fg-muted)]">Ghi chú</p>
              <textarea
                className="min-h-24 w-full rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú mục tiêu"
              />
            </div>

            <div className="mt-3 flex gap-2">
              <Button onClick={saveGoal} disabled={saving} className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 !text-white !shadow-md hover:!shadow-lg">
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> Đang lưu...
                  </span>
                ) : (
                  "💾 Lưu mục tiêu"
                )}
              </Button>
              <Button variant="secondary" onClick={loadGoals} disabled={loading}>
                Làm mới
              </Button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>          <div className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[color:var(--fg)]">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-xs text-white">📋</span>
              Mục tiêu đã lưu
            </h2>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-[var(--bg-inset)] p-4">
                    <div className="h-4 w-1/3 rounded bg-[var(--bg-elevated)]" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-[var(--bg-inset)]" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[var(--border-subtle)] p-6 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-inset)] text-xl">📭</div>
                <p className="text-sm text-[color:var(--fg-muted)]">Chưa có mục tiêu cho bộ lọc hiện tại.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] transition-colors hover:bg-[var(--bg-inset)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 50, 200)}ms` }}>
                    <div className="h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400" />
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[color:var(--fg)]">🏢 {item.branch?.name || "Toàn hệ thống"}</p>
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                          {item.periodType === "DAILY" ? `📅 ${item.dateKey}` : `🗓️ ${item.monthKey}`}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-[var(--success-bg)] px-2 py-1 text-center">
                          <p className="text-xs text-[color:var(--success)] font-medium">Doanh thu</p>
                          <p className="text-sm font-bold text-[color:var(--success-fg)]">{item.revenueTarget.toLocaleString("vi-VN")}</p>
                        </div>
                        <div className="rounded-lg bg-[var(--accent-bg)] px-2 py-1 text-center">
                          <p className="text-xs text-[color:var(--accent)] font-medium">Hồ sơ</p>
                          <p className="text-sm font-bold text-[color:var(--accent)]">{item.dossierTarget}</p>
                        </div>
                        <div className="rounded-lg bg-[var(--danger-bg)] px-2 py-1 text-center">
                          <p className="text-xs text-[color:var(--danger)] font-medium">Chi phí</p>
                          <p className="text-sm font-bold text-[color:var(--danger)]">{item.costTarget.toLocaleString("vi-VN")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
