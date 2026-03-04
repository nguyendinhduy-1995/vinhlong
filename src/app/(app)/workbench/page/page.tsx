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
    source: string | null;
    channel: string | null;
    status: string;
    ownerId: string | null;
    createdAt: string;
    owner?: { id: string; name: string | null } | null;
};

type PageKpi = {
    messagesToday: number;
    qualifiedToday: number;
    hasPhoneToday: number;
    assignedToday: number;
    invalidToday: number;
    slaAvgMinutes: number;
};

type UserOption = { id: string; name: string | null; email: string; role: string };

/* ── KPI Card ── */
function KpiCard({ label, value, icon, accent }: { label: string; value: number | string; icon: string; accent: string }) {
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

/* ── Main Page ── */
export default function PageWorkbench() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState<PageKpi | null>(null);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [phoneInput, setPhoneInput] = useState("");
    const [assignOwnerId, setAssignOwnerId] = useState("");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    const [tab, setTab] = useState<"inbox" | "qualified">("inbox");

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    }, []);

    /* ── Fetch inbox leads ── */
    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const statusFilter = tab === "inbox" ? "NEW" : "HAS_PHONE";
            const res = await fetchJson<{ items: Lead[]; total: number }>(`/api/leads?status=${statusFilter}&pageSize=50&sort=createdAt&order=desc`);
            setLeads(res.items);
            setTotal(res.total);
        } catch { /* ignore */ }
        setLoading(false);
    }, [tab]);

    /* ── Fetch KPI ── */
    const fetchKpi = useCallback(async () => {
        try {
            const res = await fetchJson<{ pageKpi: PageKpi }>("/api/kpi/daily");
            setKpi(res.pageKpi);
        } catch { /* ignore */ }
    }, []);

    /* ── Fetch users for assignment ── */
    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetchJson<{ items: UserOption[] }>("/api/admin/users?active=true&pageSize=100");
            setUsers(res.items.filter((u) => u.role === "telesales" || u.role === "manager"));
        } catch { /* ignore */ }
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        fetchLeads();
        fetchKpi();
        fetchUsers();
    }, [fetchLeads, fetchKpi, fetchUsers]);

    /* ── Qualify: set phone → HAS_PHONE ── */
    const qualifyLead = useCallback(async (leadId: string) => {
        if (!phoneInput.trim()) { showToast("Nhập số điện thoại"); return; }
        setSaving(true);
        try {
            await fetchJson(`/api/leads/${leadId}`, {
                method: "PATCH",
                body: JSON.stringify({ phone: phoneInput.trim(), status: "HAS_PHONE" }),
            });
            showToast("✅ Đã qualify — chuyển HAS_PHONE");
            setSelectedLeadId(null);
            setPhoneInput("");
            fetchLeads();
            fetchKpi();
        } catch {
            showToast("❌ Lỗi khi qualify");
        }
        setSaving(false);
    }, [phoneInput, fetchLeads, fetchKpi, showToast]);

    /* ── Assign to branch staff ── */
    const assignLead = useCallback(async (leadId: string) => {
        if (!assignOwnerId) { showToast("Chọn nhân viên để assign"); return; }
        setSaving(true);
        try {
            await fetchJson("/api/leads/assign", {
                method: "POST",
                body: JSON.stringify({ leadIds: [leadId], ownerId: assignOwnerId }),
            });
            showToast("✅ Đã assign cho nhân viên");
            setSelectedLeadId(null);
            setAssignOwnerId("");
            fetchLeads();
            fetchKpi();
        } catch {
            showToast("❌ Lỗi khi assign");
        }
        setSaving(false);
    }, [assignOwnerId, fetchLeads, fetchKpi, showToast]);

    /* ── Mark invalid ── */
    const markInvalid = useCallback(async (leadId: string) => {
        setSaving(true);
        try {
            await fetchJson(`/api/leads/${leadId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "LOST" }),
            });
            await fetchJson(`/api/leads/${leadId}/events`, {
                method: "POST",
                body: JSON.stringify({ type: "LOST", note: "Invalid / spam" }),
            });
            showToast("✅ Đã đánh dấu Invalid");
            fetchLeads();
            fetchKpi();
        } catch {
            showToast("❌ Lỗi");
        }
        setSaving(false);
    }, [fetchLeads, fetchKpi, showToast]);



    return (
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>📥 Inbox Trực Page</h1>
                <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Qualify khách mới → Lấy SĐT → Assign cho chi nhánh</p>
            </div>

            {/* KPI Cards */}
            {kpi && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <KpiCard label="Tin nhắn hôm nay" value={kpi.messagesToday} icon="💬" accent="text-blue-600" />
                    <KpiCard label="Đã qualify" value={kpi.qualifiedToday} icon="✅" accent="text-emerald-600" />
                    <KpiCard label="Có SĐT" value={kpi.hasPhoneToday} icon="📱" accent="text-teal-600" />
                    <KpiCard label="Đã assign" value={kpi.assignedToday} icon="🔀" accent="text-purple-600" />
                    <KpiCard label="Invalid" value={kpi.invalidToday} icon="🚫" accent="text-red-600" />
                    <KpiCard label="SLA trung bình" value={`${kpi.slaAvgMinutes}p`} icon="⏱️" accent="text-amber-600" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setTab("inbox")}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                        background: tab === "inbox" ? "var(--accent)" : "var(--bg-elevated)",
                        color: tab === "inbox" ? "white" : "var(--fg-secondary)",
                        border: "0.5px solid var(--border-hairline)",
                    }}
                >
                    📥 Chưa qualify ({tab === "inbox" ? total : "..."})
                </button>
                <button
                    onClick={() => setTab("qualified")}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                        background: tab === "qualified" ? "var(--accent)" : "var(--bg-elevated)",
                        color: tab === "qualified" ? "white" : "var(--fg-secondary)",
                        border: "0.5px solid var(--border-hairline)",
                    }}
                >
                    📞 Có SĐT — chờ assign ({tab === "qualified" ? total : "..."})
                </button>
            </div>

            {/* Lead List */}
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-hairline)" }}>
                {loading ? (
                    <div className="p-8 text-center" style={{ color: "var(--fg-muted)" }}>Đang tải...</div>
                ) : leads.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: "var(--fg-muted)" }}>
                        {tab === "inbox" ? "🎉 Không còn lead mới cần qualify!" : "Không có lead chờ assign"}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-hairline)", background: "var(--bg-inset)" }}>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>Khách hàng</th>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>Nguồn</th>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>Thời gian</th>
                                <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>
                                    {tab === "inbox" ? "SĐT" : "Chủ sở hữu"}
                                </th>
                                <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--fg-muted)" }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className="transition-colors cursor-pointer"
                                    style={{ borderBottom: "0.5px solid var(--border-hairline)", background: selectedLeadId === lead.id ? "var(--accent-bg)" : "transparent" }}
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-medium" style={{ color: "var(--fg)" }}>{lead.fullName || "—"}</div>
                                        {lead.phone && <div className="text-xs" style={{ color: "var(--fg-muted)" }}>{lead.phone}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-inset)", color: "var(--fg-secondary)" }}>
                                            {lead.source || "—"} / {lead.channel || "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>{formatDateTimeVi(lead.createdAt)}</td>
                                    <td className="px-4 py-3">
                                        {tab === "inbox" ? (
                                            selectedLeadId === lead.id ? (
                                                <input
                                                    type="tel"
                                                    placeholder="Nhập SĐT..."
                                                    value={phoneInput}
                                                    onChange={(e) => setPhoneInput(e.target.value)}
                                                    className="w-32 px-2 py-1 rounded text-sm outline-none ring-1"
                                                    style={{ background: "var(--bg)", color: "var(--fg)" }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-xs" style={{ color: "var(--fg-faint)" }}>Chưa có</span>
                                            )
                                        ) : (
                                            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{lead.owner?.name || "Chưa assign"}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {tab === "inbox" ? (
                                                selectedLeadId === lead.id ? (
                                                    <>
                                                        <button onClick={() => qualifyLead(lead.id)} disabled={saving}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--accent)" }}>
                                                            {saving ? "..." : "✅ Qualify"}
                                                        </button>
                                                        <button onClick={() => markInvalid(lead.id)} disabled={saving}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--danger-bg)", color: "var(--danger-fg)" }}>
                                                            🚫 Invalid
                                                        </button>
                                                        <button onClick={() => { setSelectedLeadId(null); setPhoneInput(""); }}
                                                            className="px-2 py-1.5 rounded text-xs" style={{ color: "var(--fg-muted)" }}>✕</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => setSelectedLeadId(lead.id)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                                                        📝 Qualify
                                                    </button>
                                                )
                                            ) : (
                                                selectedLeadId === lead.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <select value={assignOwnerId} onChange={(e) => setAssignOwnerId(e.target.value)}
                                                            className="px-2 py-1 rounded text-xs outline-none" style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border-hairline)" }}>
                                                            <option value="">Chọn NV...</option>
                                                            {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>)}
                                                        </select>
                                                        <button onClick={() => assignLead(lead.id)} disabled={saving}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--accent)" }}>
                                                            {saving ? "..." : "🔀 Assign"}
                                                        </button>
                                                        <button onClick={() => { setSelectedLeadId(null); setAssignOwnerId(""); }}
                                                            className="px-2 py-1.5 rounded text-xs" style={{ color: "var(--fg-muted)" }}>✕</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setSelectedLeadId(lead.id)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                                                        🔀 Assign
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer */}
            <div className="text-xs text-center py-2" style={{ color: "var(--fg-faint)" }}>
                Inbox Trực Page • Tổng: {total} lead
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
