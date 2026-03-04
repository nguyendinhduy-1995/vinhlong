"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, fetchMe, getToken } from "@/lib/auth-client";
import { todayInHoChiMinh } from "@/lib/date-utils";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { DashboardSummary, DateRange } from "./types";
import { StickyFilterBar } from "./sections/StickyFilterBar";
import { FinanceSection } from "./sections/FinanceSection";
import { FunnelSection } from "./sections/FunnelSection";
import { StaffSection } from "./sections/StaffSection";
import { KpiSection } from "./sections/KpiSection";
import { AnalyticsSection } from "./sections/AnalyticsSection";
import { CostsSection } from "./sections/CostsSection";

/* ═══════════════════════════════════════════════════════════════
   Command Center Dashboard — dark theme, grid layout
   ═══════════════════════════════════════════════════════════════ */

interface Branch { id: string; name: string; }
interface Owner { id: string; name: string; }

export default function DashboardPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  const [branchId, setBranchId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [channel, setChannel] = useState("");
  const [range, setRange] = useState<DateRange>("today");

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);

  useEffect(() => {
    fetchMe()
      .then(() => setCheckingAuth(false))
      .catch(() => { clearToken(); router.replace("/login"); });
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;
    const token = getToken();
    if (!token) return;
    Promise.all([
      fetchJson<{ items: Branch[] }>("/api/admin/branches?page=1&pageSize=100", { token }).catch(() => ({ items: [] })),
      fetchJson<{ items: Owner[] }>("/api/users?isActive=true&page=1&pageSize=200", { token }).catch(() => ({ items: [] })),
    ]).then(([bRes, uRes]) => {
      setBranches(bRes.items || []);
      setOwners(
        (uRes.items || []).map((u: { id: string; name?: string | null; email?: string }) => ({
          id: u.id,
          name: u.name || u.email || u.id,
        }))
      );
    });
  }, [checkingAuth]);

  const loadSummary = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true); setError("");
    try {
      const date = todayInHoChiMinh();
      const params = new URLSearchParams({ date, range });
      if (branchId) params.set("branchId", branchId);
      if (ownerId) params.set("ownerId", ownerId);
      const result = await fetchJson<DashboardSummary>(`/api/dashboard/summary?${params.toString()}`, { token });
      setData(result);
    } catch (e) {
      const err = e as ApiClientError;
      if (err.code === "AUTH_MISSING_BEARER" || err.code === "AUTH_INVALID_TOKEN") {
        clearToken(); router.replace("/login"); return;
      }
      setError(`Không thể tải dashboard: ${err.message || "Unknown error"}`);
    } finally { setLoading(false); }
  }, [branchId, ownerId, range, router]);

  useEffect(() => { if (!checkingAuth) loadSummary(); }, [checkingAuth, loadSummary]);
  useEffect(() => {
    if (checkingAuth) return;
    const t = setInterval(loadSummary, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [checkingAuth, loadSummary]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Đang tải Command Center...</p>
        </div>
      </div>
    );
  }

  const isFirstLoad = loading && !data;

  return (
    <div className="cc-root">
      <style>{`
        .cc-root {
          --cc-bg: #0f172a;
          --cc-surface: #1e293b;
          --cc-border: #334155;
          --cc-text: #f1f5f9;
          --cc-text-dim: #94a3b8;
          --cc-text-faint: #64748b;
          --cc-blue: #3b82f6;
          --cc-violet: #8b5cf6;
          --cc-amber: #f59e0b;
          --cc-emerald: #10b981;
          --cc-red: #ef4444;
          --cc-pink: #ec4899;
          background: var(--cc-bg);
          color: var(--cc-text);
          border-radius: 16px;
          padding: 20px;
          margin: -20px -24px;
          min-height: calc(100vh - 64px);
        }
        .cc-card {
          background: var(--cc-surface);
          border: 1px solid var(--cc-border);
          border-radius: 12px;
        }
        .cc-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--cc-text-dim);
        }
        .cc-value {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .cc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cc-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .cc-grid-6 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
        .cc-row { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
        @media (max-width: 768px) {
          .cc-grid-2, .cc-grid-3, .cc-row { grid-template-columns: 1fr; }
          .cc-grid-6 { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* Filter Bar */}
      <StickyFilterBar
        branches={branches} owners={owners}
        branchId={branchId} ownerId={ownerId} channel={channel} range={range}
        lastSync={data?.lastSync || ""}
        onBranchChange={setBranchId} onOwnerChange={setOwnerId}
        onChannelChange={setChannel} onRangeChange={setRange}
        onRefresh={loadSummary} loading={loading}
      />

      {error && <div style={{ margin: "12px 0" }}><Alert type="error" message={error} /></div>}

      {/* ROW 1: Finance hero cards */}
      <div style={{ marginTop: 16 }}>
        <FinanceSection data={data?.finance || null} aiInsight={data?.aiInsights.finance || null} loading={isFirstLoad} />
      </div>

      {/* ROW 2: Funnel (60%) + Staff (40%) */}
      <div className="cc-row" style={{ marginTop: 16 }}>
        <FunnelSection data={data?.funnel || null} aiInsight={data?.aiInsights.funnel || null} loading={isFirstLoad} />
        <StaffSection data={data?.staff || null} aiInsight={data?.aiInsights.staff || null} loading={isFirstLoad} />
      </div>

      {/* ROW 3: KPI (60%) + Costs (40%) */}
      <div className="cc-row" style={{ marginTop: 16 }}>
        <div>
          <KpiSection data={data?.kpi || null} aiInsight={data?.aiInsights.kpi || null} loading={isFirstLoad} />
          <div style={{ marginTop: 16 }}>
            <AnalyticsSection data={data?.analytics || null} aiInsight={data?.aiInsights.analytics || null} loading={isFirstLoad} />
          </div>
        </div>
        <CostsSection data={data?.costs || null} aiInsight={data?.aiInsights.costs || null} loading={isFirstLoad} />
      </div>
    </div>
  );
}
