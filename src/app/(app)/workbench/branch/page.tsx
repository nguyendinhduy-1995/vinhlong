"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/api-client";
import { formatDateTimeVi } from "@/lib/date-utils";

/* ── Types ── */
type Lead = {
    id: string;
    fullName: string | null;
    phone: string | null;
    province: string | null;
    status: string;
    ownerId: string | null;
    createdAt: string;
};

type BranchKpi = {
    calledToday: number;
    appointedToday: number;
    arrivedToday: number;
    signedToday: number;
    lostToday: number;
};

const STATUS_ACTIONS: Record<string, { label: string; icon: string; next: string; eventType: string }[]> = {
    HAS_PHONE: [
        { label: "Đã gọi", icon: "📞", next: "HAS_PHONE", eventType: "CALLED" },
        { label: "Hẹn lịch", icon: "📅", next: "APPOINTED", eventType: "APPOINTED" },
        { label: "Mất", icon: "❌", next: "LOST", eventType: "LOST" },
    ],
    APPOINTED: [
        { label: "Đã gọi", icon: "📞", next: "APPOINTED", eventType: "CALLED" },
        { label: "Đã đến", icon: "🏢", next: "ARRIVED", eventType: "ARRIVED" },
        { label: "Mất", icon: "❌", next: "LOST", eventType: "LOST" },
    ],
    ARRIVED: [
        { label: "Ghi danh", icon: "✍️", next: "SIGNED", eventType: "SIGNED" },
        { label: "Mất", icon: "❌", next: "LOST", eventType: "LOST" },
    ],
};

const STATUS_LABELS: Record<string, string> = {
    HAS_PHONE: "Có SĐT",
    APPOINTED: "Đã hẹn",
    ARRIVED: "Đã đến",
    SIGNED: "Đã ghi danh",
    LOST: "Mất",
};

/* ── KPI Card ── */
function KpiCard({ label, value, icon, accent }: { label: string; value: number; icon: string; accent: string }) {
    return (
        <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-hairline)" }}>
            <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>{label}</span>
            </div>
            <span className={`text-2xl font-bold ${accent}`}>{value}</span>
        </div>
    );
}

/* ── Main ── */
export default function BranchWorkbench() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState<BranchKpi | null>(null);
    const [activeStatus, setActiveStatus] = useState("HAS_PHONE");
    const [actionLeadId, setActionLeadId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    const [noteInput, setNoteInput] = useState("");

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    }, []);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchJson<{ items: Lead[]; total: number }>(
                `/api/leads?status=${activeStatus}&pageSize=50&sort=createdAt&order=desc`
            );
            setLeads(res.items);
            setTotal(res.total);
        } catch { /* ignore */ }
        setLoading(false);
    }, [activeStatus]);

    const fetchKpi = useCallback(async () => {
        try {
            const res = await fetchJson<{ branchKpi: BranchKpi }>("/api/kpi/daily");
            setKpi(res.branchKpi);
        } catch { /* ignore */ }
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        fetchLeads();
        fetchKpi();
    }, [fetchLeads, fetchKpi]);

    const performAction = useCallback(async (leadId: string, eventType: string, nextStatus: string) => {
        setSaving(true);
        try {
            await fetchJson(`/api/leads/${leadId}/events`, {
                method: "POST",
                body: JSON.stringify({ type: eventType, note: noteInput || undefined }),
            });
            if (nextStatus !== activeStatus) {
                await fetchJson(`/api/leads/${leadId}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: nextStatus }),
                });
            }
            showToast(`✅ ${STATUS_LABELS[nextStatus] || nextStatus}`);
            setActionLeadId(null);
            setNoteInput("");
            fetchLeads();
            fetchKpi();
        } catch {
            showToast("❌ Lỗi khi thực hiện");
        }
        setSaving(false);
    }, [activeStatus, noteInput, fetchLeads, fetchKpi, showToast]);

    const statusTabs = ["HAS_PHONE", "APPOINTED", "ARRIVED"] as const;
    const actions = STATUS_ACTIONS[activeStatus] || [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>📞 Công việc Chi nhánh</h1>
                <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Gọi → Hẹn → Đón → Ký hợp đồng</p>
            </div>

            {/* KPI Cards */}
            {kpi && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <KpiCard label="Đã gọi" value={kpi.calledToday} icon="📞" accent="text-teal-600" />
                    <KpiCard label="Đã hẹn" value={kpi.appointedToday} icon="📅" accent="text-orange-600" />
                    <KpiCard label="Đã đến" value={kpi.arrivedToday} icon="🏢" accent="text-purple-600" />
                    <KpiCard label="Đã ký" value={kpi.signedToday} icon="✍️" accent="text-emerald-600" />
                    <KpiCard label="Mất" value={kpi.lostToday} icon="❌" accent="text-red-600" />
                </div>
            )}

            {/* Status Tabs */}
            <div className="flex gap-2">
                {statusTabs.map((s) => (
                    <button
                        key={s}
                        onClick={() => { setActiveStatus(s); setActionLeadId(null); }}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                            background: activeStatus === s ? "var(--accent)" : "var(--bg-elevated)",
                            color: activeStatus === s ? "white" : "var(--fg-secondary)",
                            border: "0.5px solid var(--border-hairline)",
                        }}
                    >
                        {STATUS_LABELS[s]} {activeStatus === s ? `(${total})` : ""}
                    </button>
                ))}
            </div>

            {/* Lead List */}
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-hairline)" }}>
                {loading ? (
                    <div className="p-8 text-center" style={{ color: "var(--fg-muted)" }}>Đang tải...</div>
                ) : leads.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: "var(--fg-muted)" }}>
                        Không có lead ở trạng thái {STATUS_LABELS[activeStatus]}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-hairline)", background: "var(--bg-inset)" }}>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>Khách hàng</th>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>SĐT</th>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>Tỉnh</th>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>Thời gian</th>
                                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className="transition-colors cursor-pointer"
                                    style={{ borderBottom: "0.5px solid var(--border-hairline)", background: actionLeadId === lead.id ? "var(--accent-bg)" : "transparent" }}
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-medium" style={{ color: "var(--fg)" }}>{lead.fullName || "—"}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline text-sm">{lead.phone || "—"}</a>
                                    </td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>{lead.province || "—"}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>{formatDateTimeVi(lead.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        {actionLeadId === lead.id ? (
                                            <div className="flex items-center justify-end gap-2 flex-wrap">
                                                <input
                                                    type="text"
                                                    placeholder="Ghi chú..."
                                                    value={noteInput}
                                                    onChange={(e) => setNoteInput(e.target.value)}
                                                    className="w-28 px-2 py-1 rounded text-xs outline-none"
                                                    style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border-hairline)" }}
                                                />
                                                {actions.map((action) => (
                                                    <button
                                                        key={action.eventType}
                                                        onClick={() => performAction(lead.id, action.eventType, action.next)}
                                                        disabled={saving}
                                                        className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                                                        style={{
                                                            background: action.next === "LOST" ? "var(--danger-bg)" : "var(--accent-bg)",
                                                            color: action.next === "LOST" ? "var(--danger-fg)" : "var(--accent)",
                                                        }}
                                                    >
                                                        {action.icon} {action.label}
                                                    </button>
                                                ))}
                                                <button onClick={() => { setActionLeadId(null); setNoteInput(""); }}
                                                    className="px-2 py-1 rounded text-xs" style={{ color: "var(--fg-muted)" }}>✕</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setActionLeadId(lead.id)}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                                                ⚡ Hành động
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            <div className="text-xs text-center py-2" style={{ color: "var(--fg-faint)" }}>
                Công việc Chi nhánh • {total} lead
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 px-4 py-2 rounded-xl text-sm font-medium shadow-xl z-50"
                    style={{ background: "var(--bg-elevated)", color: "var(--fg)", border: "1px solid var(--border-hairline)" }}>
                    {toast}
                </div>
            )}
        </div>
    );
}
