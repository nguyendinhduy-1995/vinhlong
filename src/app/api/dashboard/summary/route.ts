import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/auth";

/* ═══════════════════════════════════════════════════════════════
   GET /api/dashboard/summary
   Unified endpoint returning all dashboard sections in one call.
   Query: date, range (today|yesterday|7d|mtd), branchId, ownerId
   ═══════════════════════════════════════════════════════════════ */

function toVnDate(d: Date) {
    return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
}

function startOfDayVN(dateStr?: string) {
    const base = dateStr ? new Date(dateStr + "T00:00:00+07:00") : new Date();
    const vn = toVnDate(base);
    vn.setHours(0, 0, 0, 0);
    return vn;
}

function endOfDayVN(dateStr?: string) {
    const d = startOfDayVN(dateStr);
    d.setHours(23, 59, 59, 999);
    return d;
}

function getDateRange(date: string, range: string) {
    const end = endOfDayVN(date);
    let start: Date;
    switch (range) {
        case "yesterday": {
            const d = startOfDayVN(date);
            d.setDate(d.getDate() - 1);
            start = d;
            const e = new Date(d);
            e.setHours(23, 59, 59, 999);
            return { start, end: e };
        }
        case "7d": {
            start = startOfDayVN(date);
            start.setDate(start.getDate() - 6);
            return { start, end };
        }
        case "mtd": {
            start = startOfDayVN(date);
            start.setDate(1);
            return { start, end };
        }
        default:
            start = startOfDayVN(date);
            return { start, end };
    }
}

function ratio(num: number, den: number) {
    if (den === 0) return 0;
    return Math.round((num / den) * 1000) / 10;
}

export async function GET(req: NextRequest) {
    try {
        requireAuth(req);

        const url = new URL(req.url);
        const dateParam = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
        const range = url.searchParams.get("range") || "today";
        const branchId = url.searchParams.get("branchId") || undefined;
        const ownerId = url.searchParams.get("ownerId") || undefined;

        const { start, end } = getDateRange(dateParam, range);

        // ── Branch/Owner filter for Lead queries ──
        const leadWhere: Record<string, unknown> = {};
        if (branchId) leadWhere.branchId = branchId;
        if (ownerId) leadWhere.ownerId = ownerId;

        const eventDateWhere = { createdAt: { gte: start, lte: end } };

        // ══════════════════════════════════════════
        // Run all queries in parallel
        // ══════════════════════════════════════════
        const [
            // Finance
            signedTodayCount,
            receiptAgg,
            paid50Result,

            // Funnel
            funnelCounts,

            // Staff
            staffEventCounts,
            staffLeadCounts,
            allUsers,

            // KPI
            kpiTargets,

            // Costs
            expenseAgg,
            payrollAgg,
        ] = await Promise.all([
            // ── Finance: signed today ──
            prisma.leadEvent.count({
                where: {
                    type: "SIGNED",
                    ...eventDateWhere,
                    lead: leadWhere,
                },
            }),

            // ── Finance: total thu today ──
            prisma.receipt.aggregate({
                _sum: { amount: true },
                _count: true,
                where: {
                    receivedAt: { gte: start, lte: end },
                    ...(branchId ? { branchId } : {}),
                },
            }),

            // ── Finance: count paid >= 50% ──
            prisma.$queryRawUnsafe<Array<{ cnt: bigint }>>(
                `SELECT COUNT(*) as cnt FROM (
          SELECT s.id, s."tuitionSnapshot",
            COALESCE((SELECT SUM(r.amount) FROM "Receipt" r WHERE r."studentId" = s.id), 0) as paid
          FROM "Student" s
          WHERE s."tuitionSnapshot" > 0
            ${branchId ? `AND s."branchId" = $1` : ""}
          HAVING COALESCE((SELECT SUM(r.amount) FROM "Receipt" r WHERE r."studentId" = s.id), 0) >= s."tuitionSnapshot" * 0.5
        ) sub`,
                ...(branchId ? [branchId] : [])
            ).catch(() => [{ cnt: BigInt(0) }]),

            // ── Funnel: group by type ──
            prisma.leadEvent.groupBy({
                by: ["type"],
                _count: true,
                where: {
                    ...eventDateWhere,
                    lead: leadWhere,
                    type: { in: ["NEW", "HAS_PHONE", "CALLED", "APPOINTED", "ARRIVED", "SIGNED"] },
                },
            }),

            // ── Staff: events grouped by createdById + type ──
            prisma.leadEvent.groupBy({
                by: ["createdById", "type"],
                _count: true,
                where: {
                    ...eventDateWhere,
                    lead: leadWhere,
                    type: { in: ["HAS_PHONE", "CALLED", "APPOINTED", "ARRIVED", "SIGNED"] },
                    createdById: { not: null },
                },
            }),

            // ── Staff: leads grouped by ownerId ──
            prisma.lead.groupBy({
                by: ["ownerId"],
                _count: true,
                where: {
                    ...leadWhere,
                    ownerId: { not: null },
                    createdAt: { gte: start, lte: end },
                },
            }),

            // ── Users for staff names ──
            prisma.user.findMany({
                where: { isActive: true },
                select: { id: true, name: true, email: true, role: true },
            }),

            // ── KPI targets ──
            prisma.kpiTarget.findMany({
                where: {
                    isActive: true,
                    ...(branchId ? { branchId } : {}),
                    ...(ownerId ? { ownerId } : {}),
                },
                select: { metricKey: true, targetValue: true, role: true },
            }),

            // ── Costs: expenses ──
            prisma.branchExpenseDaily.aggregate({
                _sum: { amountVnd: true },
                where: {
                    date: { gte: start, lte: end },
                    ...(branchId ? { branchId } : {}),
                },
            }),

            // ── Costs: payroll estimate ──
            prisma.salaryProfile.aggregate({
                _sum: { baseSalaryVnd: true },
                where: {
                    ...(branchId ? { branchId } : {}),
                },
            }).catch(() => ({ _sum: { baseSalaryVnd: null } })),
        ]);

        // ══════════════════════════════════════════
        // Build finance
        // ══════════════════════════════════════════
        const finance = {
            signedToday: signedTodayCount,
            totalThuToday: receiptAgg._sum.amount || 0,
            countPaid50: Number(paid50Result[0]?.cnt || 0),
        };

        // ══════════════════════════════════════════
        // Build funnel
        // ══════════════════════════════════════════
        const funnelMap: Record<string, number> = {};
        for (const row of funnelCounts) {
            funnelMap[row.type] = row._count;
        }
        const messages = funnelMap.NEW || 0;
        const hasPhoneTotal = funnelMap.HAS_PHONE || 0;
        const called = funnelMap.CALLED || 0;
        const appointed = funnelMap.APPOINTED || 0;
        const arrived = funnelMap.ARRIVED || 0;
        const signed = funnelMap.SIGNED || 0;

        const funnel = {
            messages,
            hasPhonePage: hasPhoneTotal, // TODO: split by payload.source
            hasPhoneLanding: 0,
            hasPhoneTotal,
            called,
            appointed,
            arrived,
            signed,
            ratios: {
                hasPhonePerMsg: ratio(hasPhoneTotal, messages),
                calledPerHasPhone: ratio(called, hasPhoneTotal),
                appointedPerCalled: ratio(appointed, called),
                arrivedPerAppointed: ratio(arrived, appointed),
                signedPerArrived: ratio(signed, arrived),
            },
        };

        // ══════════════════════════════════════════
        // Build staff
        // ══════════════════════════════════════════
        const userMap = new Map(allUsers.map((u) => [u.id, u]));
        const staffMap = new Map<string, {
            assigned: number; hasPhone: number; called: number;
            appointed: number; arrived: number; signed: number;
        }>();

        // Init from lead assignments
        for (const row of staffLeadCounts) {
            if (!row.ownerId) continue;
            if (!staffMap.has(row.ownerId)) {
                staffMap.set(row.ownerId, { assigned: 0, hasPhone: 0, called: 0, appointed: 0, arrived: 0, signed: 0 });
            }
            staffMap.get(row.ownerId)!.assigned = row._count;
        }

        // Fill from events
        for (const row of staffEventCounts) {
            const uid = row.createdById;
            if (!uid) continue;
            if (!staffMap.has(uid)) {
                staffMap.set(uid, { assigned: 0, hasPhone: 0, called: 0, appointed: 0, arrived: 0, signed: 0 });
            }
            const s = staffMap.get(uid)!;
            const key = row.type.toLowerCase() as "has_phone" | "called" | "appointed" | "arrived" | "signed";
            if (key === "has_phone") s.hasPhone += row._count;
            else if (key in s) (s as Record<string, number>)[key] += row._count;
        }

        const staffRows = Array.from(staffMap.entries()).map(([userId, s]) => {
            const user = userMap.get(userId);
            return {
                userId,
                name: user?.name || user?.email || userId,
                role: user?.role || "",
                ...s,
                pendingCall: Math.max(0, s.hasPhone - s.called),
                pendingAppt: Math.max(0, s.called - s.appointed),
                pendingArrival: Math.max(0, s.appointed - s.arrived),
                pendingSign: Math.max(0, s.arrived - s.signed),
                kpiPct: null as number | null,
            };
        }).sort((a, b) => b.signed - a.signed);

        const staffSummary = {
            totalCalled: staffRows.reduce((s, r) => s + r.called, 0),
            uncalled: staffRows.reduce((s, r) => s + r.pendingCall, 0),
            totalAppointed: staffRows.reduce((s, r) => s + r.appointed, 0),
            unappointed: staffRows.reduce((s, r) => s + r.pendingAppt, 0),
            totalArrived: staffRows.reduce((s, r) => s + r.arrived, 0),
            unarrived: staffRows.reduce((s, r) => s + r.pendingArrival, 0),
            totalSigned: staffRows.reduce((s, r) => s + r.signed, 0),
            unsigned: staffRows.reduce((s, r) => s + r.pendingSign, 0),
        };

        // ══════════════════════════════════════════
        // Build KPI
        // ══════════════════════════════════════════
        const kpiMetricLabels: Record<string, string> = {
            messages: "Tin nhắn",
            has_phone: "Có SĐT",
            called: "Đã gọi",
            appointed: "Đã hẹn",
            arrived: "Đã đến",
            signed: "Đã ký",
        };
        const kpiActuals: Record<string, number> = {
            messages, has_phone: hasPhoneTotal, called, appointed, arrived, signed,
        };

        // Aggregate targets by metricKey
        const targetMap = new Map<string, number>();
        for (const t of kpiTargets) {
            const key = t.metricKey.toLowerCase();
            targetMap.set(key, (targetMap.get(key) || 0) + t.targetValue);
        }

        const kpiMetrics = Object.entries(kpiMetricLabels).map(([key, label]) => {
            const actual = kpiActuals[key] || 0;
            const target = targetMap.get(key) || 0;
            return {
                metricKey: key,
                label,
                actual,
                target,
                pct: target > 0 ? Math.round((actual / target) * 100) : 0,
                trend: "flat" as const,
            };
        });

        // ══════════════════════════════════════════
        // Build costs
        // ══════════════════════════════════════════
        const marketingCost = expenseAgg._sum.amountVnd || 0;
        const payrollEstimate = (payrollAgg._sum as { baseSalaryVnd?: number | null })?.baseSalaryVnd || 0;
        const totalCost = marketingCost + payrollEstimate;
        const revenue = finance.totalThuToday;
        const costs = {
            marketing: marketingCost,
            payroll: payrollEstimate,
            fixed: 0,
            total: totalCost,
            revenue,
            profit: revenue - totalCost,
        };

        // ══════════════════════════════════════════
        // Build analytics (placeholder — needs GA4 integration)
        // ══════════════════════════════════════════
        const analytics = {
            online: 0,
            users: 0,
            pageviews: 0,
            sessions: 0,
            avgDuration: 0,
        };

        // ══════════════════════════════════════════
        // AI insights (placeholder — populated later)
        // ══════════════════════════════════════════
        const aiInsights = {
            finance: null,
            funnel: null,
            staff: null,
            kpi: null,
            analytics: null,
            costs: null,
        };

        return NextResponse.json({
            lastSync: new Date().toISOString(),
            finance,
            funnel,
            staff: { summary: staffSummary, rows: staffRows },
            kpi: { metrics: kpiMetrics },
            analytics,
            costs,
            aiInsights,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("[dashboard/summary]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
