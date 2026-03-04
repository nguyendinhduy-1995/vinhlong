/* ═══════════════════════════════════════════════════════════════
   Dashboard Command Center — Shared Types
   ═══════════════════════════════════════════════════════════════ */

export type DateRange = "today" | "yesterday" | "7d" | "mtd";

export interface DashboardFilters {
    date: string;       // YYYY-MM-DD
    range: DateRange;
    branchId?: string;
    ownerId?: string;
    channel?: string;   // page | landing
}

/* ── Finance ── */
export interface FinanceData {
    signedToday: number;
    totalThuToday: number;
    countPaid50: number;
}

/* ── Funnel ── */
export interface FunnelData {
    messages: number;
    hasPhonePage: number;
    hasPhoneLanding: number;
    hasPhoneTotal: number;
    called: number;
    appointed: number;
    arrived: number;
    signed: number;
    ratios: {
        hasPhonePerMsg: number;
        calledPerHasPhone: number;
        appointedPerCalled: number;
        arrivedPerAppointed: number;
        signedPerArrived: number;
    };
}

/* ── Staff ── */
export interface StaffRow {
    userId: string;
    name: string;
    role: string;
    assigned: number;
    hasPhone: number;
    called: number;
    appointed: number;
    arrived: number;
    signed: number;
    pendingCall: number;
    pendingAppt: number;
    pendingArrival: number;
    pendingSign: number;
    kpiPct: number | null;
}

export interface StaffData {
    summary: {
        totalCalled: number;
        uncalled: number;
        totalAppointed: number;
        unappointed: number;
        totalArrived: number;
        unarrived: number;
        totalSigned: number;
        unsigned: number;
    };
    rows: StaffRow[];
}

/* ── KPI ── */
export interface KpiMetric {
    metricKey: string;
    label: string;
    actual: number;
    target: number;
    pct: number;
    trend: "up" | "down" | "flat";
}

export interface KpiData {
    metrics: KpiMetric[];
}

/* ── Analytics ── */
export interface AnalyticsData {
    online: number;
    users: number;
    pageviews: number;
    sessions: number;
    avgDuration: number;
}

/* ── Costs ── */
export interface CostsData {
    marketing: number;
    payroll: number;
    fixed: number;
    total: number;
    revenue: number;
    profit: number;
}

/* ── AI Insights ── */
export interface AiInsight {
    observation: string;  // Nhận định
    warning: string;      // Cảnh báo
    action: string;       // Đề xuất hành động
}

export interface AiInsightsMap {
    finance: AiInsight | null;
    funnel: AiInsight | null;
    staff: AiInsight | null;
    kpi: AiInsight | null;
    analytics: AiInsight | null;
    costs: AiInsight | null;
}

/* ── Full Response ── */
export interface DashboardSummary {
    lastSync: string;
    finance: FinanceData;
    funnel: FunnelData;
    staff: StaffData;
    kpi: KpiData;
    analytics: AnalyticsData;
    costs: CostsData;
    aiInsights: AiInsightsMap;
}
