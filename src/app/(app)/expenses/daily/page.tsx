"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { getToken } from "@/lib/auth-client";
import { todayInHoChiMinh, formatCurrencyVnd } from "@/lib/date-utils";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DailyItem = {
  categoryId: string;
  categoryName: string;
  amountVnd: number;
  note: string;
};

type DailyResponse = {
  branchId: string;
  dateKey: string;
  items: DailyItem[];
  totalVnd: number;
};

function toMonthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

export default function ExpensesDailyPage() {
  const toast = useToast();
  const [dateKey, setDateKey] = useState(todayInHoChiMinh());
  const [items, setItems] = useState<DailyItem[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalVnd = useMemo(() => items.reduce((sum, item) => sum + (item.amountVnd || 0), 0), [items]);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson<DailyResponse>(`/api/expenses/daily?date=${dateKey}`, { token });
      setItems(data.items);
      setBranchId(data.branchId);
    } catch (e) {
      const err = e as ApiClientError;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function saveData() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        dateKey,
        branchId,
        items: items.map((item) => ({
          categoryId: item.categoryId,
          amountVnd: Number(item.amountVnd || 0),
          note: item.note || "",
        })),
      };
      const data = await fetchJson<DailyResponse>("/api/expenses/daily", {
        method: "POST",
        token,
        body: payload,
      });
      setItems(data.items);
      toast.success("Đã lưu chi phí trong ngày.");
    } catch (e) {
      const err = e as ApiClientError;
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">💰</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Chi phí theo ngày</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Nhập chi phí vận hành theo danh mục của chi nhánh.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/expenses/monthly?month=${toMonthKey(dateKey)}`} className="inline-flex h-10 items-center rounded-xl bg-[var(--bg-elevated)] border border-white/30 px-3 text-sm text-white hover:bg-white/30 backdrop-blur-sm transition">📊 Xem tổng hợp tháng</Link>
            <Button onClick={saveData} disabled={saving || loading} >
              {saving ? "Đang lưu..." : "💾 Lưu chi phí"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Date picker & total ── */}
      <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>        <div className="grid gap-3 p-4 sm:grid-cols-[220px_1fr]">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--fg-muted)]">📅 Ngày</label>
            <Input type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
          </div>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--success-bg)] p-3">
            <p className="text-xs uppercase tracking-wide text-[color:var(--success)]">Tổng chi phí ngày</p>
            <p className="text-xl font-semibold text-[color:var(--success-fg)]">{formatCurrencyVnd(totalVnd)}</p>
          </div>
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 surface rounded-xl p-3">
              <div className="h-9 w-9 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="flex-1 space-y-2"><div className="h-4 w-1/3 rounded bg-[var(--bg-elevated)]" /><div className="h-3 w-1/2 rounded bg-[var(--bg-inset)]" /></div>
              <div className="h-8 w-24 rounded bg-[var(--bg-elevated)]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>          <div className="p-4">
            <h3 className="text-sm font-semibold text-[color:var(--fg)] mb-2">📋 Danh mục chi phí</h3>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.categoryId} className="grid gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-3 md:grid-cols-[1fr_180px_1fr] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 40, 200)}ms` }}>
                  <div>
                    <p className="text-sm font-medium text-[color:var(--fg)]">{item.categoryName}</p>
                  </div>
                  <Input type="number" min={0} value={item.amountVnd} onChange={(e) => { const value = Number(e.target.value || 0); setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, amountVnd: value } : row))); }} />
                  <Input value={item.note} placeholder="Ghi chú (tuỳ chọn)" onChange={(e) => { const value = e.target.value; setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, note: value } : row))); }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
