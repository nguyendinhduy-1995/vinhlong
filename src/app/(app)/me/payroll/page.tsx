"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, getToken } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { formatCurrencyVnd } from "@/lib/date-utils";

type PayrollItem = {
  id: string;
  month: string;
  runStatus: "DRAFT" | "FINAL" | "PAID";
  branch: { id: string; name: string };
  baseSalaryVnd: number;
  allowanceVnd: number;
  daysWorked: number;
  standardDays: number;
  baseProratedVnd: number;
  commissionVnd: number;
  penaltyVnd: number;
  bonusVnd: number;
  totalVnd: number;
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatApiError(err: ApiClientError) {
  return `${err.code}: ${err.message}`;
}

export default function MePayrollPage() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.totalVnd, 0);
    const commission = items.reduce((sum, item) => sum + item.commissionVnd, 0);
    return { total, commission, count: items.length };
  }, [items]);

  useEffect(() => {
    async function load() {
      const token = getToken();
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const data = await fetchJson<{ items: PayrollItem[] }>(`/api/me/payroll?month=${month}`, { token });
        setItems(data.items);
      } catch (e) {
        const err = e as ApiClientError;
        if (err.code === "AUTH_MISSING_BEARER" || err.code === "AUTH_INVALID_TOKEN") {
          clearToken();
          router.replace("/login");
          return;
        }
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [month, router]);

  return (
    <div className="space-y-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">💵</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Phiếu lương của tôi</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Theo dõi thu nhập theo tháng</p>
          </div>
          <div className="flex items-center gap-2">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[180px] !bg-[var(--bg-elevated)] !text-white !border-white/30" />
            <Button variant="secondary" onClick={() => setMonth(currentMonth())} >Tháng này</Button>
          </div>
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}

      <div className="grid gap-3 md:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <div className="overflow-hidden glass-2 rounded-2xl">          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-[color:var(--success)]">Tổng thực nhận</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--fg)]">{formatCurrencyVnd(summary.total)}</p>
          </div>
        </div>
        <div className="overflow-hidden glass-2 rounded-2xl">          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-violet-600">🏆 Hoa hồng</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--fg)]">{formatCurrencyVnd(summary.commission)}</p>
          </div>
        </div>
        <div className="overflow-hidden glass-2 rounded-2xl">          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-[color:var(--accent)]">📄 Số phiếu lương</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--fg)]">{summary.count}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 surface rounded-xl p-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="flex-1 space-y-2"><div className="h-4 w-1/4 rounded bg-[var(--bg-elevated)]" /><div className="h-3 w-1/2 rounded bg-[var(--bg-inset)]" /></div>
              <div className="h-6 w-20 rounded-full bg-[var(--bg-elevated)]" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-2 rounded-2xl p-8 text-center animate-fade-in-up">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-inset)] text-2xl">📭</div>
          <p className="font-medium text-[color:var(--fg)]">Chưa có phiếu lương</p>
          <p className="mt-1 text-sm text-[color:var(--fg-muted)]">Chưa có phiếu lương trong tháng đã chọn.</p>
        </div>
      ) : (
        <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <Table headers={["Tháng", "Chi nhánh", "Công", "Lương theo công", "Phụ cấp", "Hoa hồng", "Thưởng/Phạt", "Tổng", "Trạng thái"]}>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 40, 300)}ms` }}>
                <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.month}</td>
                <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.branch.name}</td>
                <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{item.daysWorked} / {item.standardDays}</td>
                <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{formatCurrencyVnd(item.baseProratedVnd)}</td>
                <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{formatCurrencyVnd(item.allowanceVnd)}</td>
                <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{formatCurrencyVnd(item.commissionVnd)}</td>
                <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{formatCurrencyVnd(item.bonusVnd - item.penaltyVnd)}</td>
                <td className="px-3 py-2 text-sm font-semibold text-[color:var(--fg)]">{formatCurrencyVnd(item.totalVnd)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold border ${item.runStatus === "FINAL" ? "bg-[var(--success-bg)] text-[color:var(--success-fg)] border-[var(--border-subtle)]" : item.runStatus === "PAID" ? "bg-[var(--accent-bg)] text-[color:var(--accent)] border-[var(--border-subtle)]" : "bg-[var(--warning-bg)] text-[color:var(--warning-fg)] border-[var(--border-subtle)]"}`}>
                    {item.runStatus === "FINAL" ? "✅ Chốt" : item.runStatus === "PAID" ? "💳 Đã trả" : "📝 Nháp"}
                  </span>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </div>
  );
}
