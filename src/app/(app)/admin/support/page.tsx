"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/api-client";
import { formatDateTimeVi } from "@/lib/date-utils";

/* ── Types ── */
type Ticket = {
    id: string;
    title: string;
    message: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    status: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string | null;
    owner?: { id: string; name: string | null; email: string } | null;
};

const PRIORITY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    HIGH: { label: "Khẩn cấp", color: "#ef4444", icon: "🔴" },
    MEDIUM: { label: "Bình thường", color: "#f59e0b", icon: "🟡" },
    LOW: { label: "Thấp", color: "#64748b", icon: "⚪" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    open: { label: "Mở", color: "#3b82f6" },
    in_progress: { label: "Đang xử lý", color: "#f59e0b" },
    done: { label: "Đã xong", color: "#10b981" },
};

const STATUS_FILTERS = ["all", "open", "in_progress", "done"] as const;

/* ── Main ── */
export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    }, []);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
            const res = await fetchJson<{ items: Ticket[] }>(`/api/tasks?scope=SUPPORT&pageSize=100${statusParam}`);
            setTickets(res.items);
        } catch { /* ignore */ }
        setLoading(false);
    }, [statusFilter]);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const updateTicketStatus = useCallback(async (ticketId: string, newStatus: string) => {
        setSaving(true);
        try {
            await fetchJson(`/api/tasks/${ticketId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            showToast(`✅ Đã cập nhật trạng thái → ${STATUS_LABELS[newStatus]?.label || newStatus}`);
            setActiveTicketId(null);
            fetchTickets();
        } catch {
            showToast("❌ Lỗi khi cập nhật");
        }
        setSaving(false);
    }, [fetchTickets, showToast]);

    const openCount = tickets.filter((t) => t.status === "open").length;
    const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>🎫 Quản lý Hỗ trợ</h1>
                <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
                    Xem và xử lý các yêu cầu hỗ trợ từ nhân viên
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-hairline)" }}>
                    <div className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Đang mở</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">{openCount}</div>
                </div>
                <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-hairline)" }}>
                    <div className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Đang xử lý</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</div>
                </div>
                <div className="rounded-xl p-4" style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-hairline)" }}>
                    <div className="text-xs font-medium" style={{ color: "var(--fg-muted)" }}>Tổng ticket</div>
                    <div className="text-2xl font-bold mt-1" style={{ color: "var(--fg)" }}>{tickets.length}</div>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
                {STATUS_FILTERS.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                            background: statusFilter === s ? "var(--accent)" : "var(--bg-elevated)",
                            color: statusFilter === s ? "white" : "var(--fg-secondary)",
                            border: "0.5px solid var(--border-hairline)",
                        }}
                    >
                        {s === "all" ? "Tất cả" : STATUS_LABELS[s]?.label || s}
                    </button>
                ))}
            </div>

            {/* Ticket List */}
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-hairline)" }}>
                {loading ? (
                    <div className="p-8 text-center" style={{ color: "var(--fg-muted)" }}>Đang tải...</div>
                ) : tickets.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: "var(--fg-muted)" }}>
                        {statusFilter === "all" ? "Chưa có yêu cầu hỗ trợ nào" : `Không có ticket ở trạng thái "${STATUS_LABELS[statusFilter]?.label}"`}
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
                        {tickets.map((t) => {
                            const pInfo = PRIORITY_LABELS[t.priority] || PRIORITY_LABELS.MEDIUM;
                            const sInfo = STATUS_LABELS[t.status] || STATUS_LABELS.open;
                            const isActive = activeTicketId === t.id;
                            return (
                                <div key={t.id} className="px-4 py-4 transition-colors" style={{ background: isActive ? "var(--accent-bg)" : "transparent" }}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg mt-0.5">{pInfo.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>{t.title}</span>
                                                <span
                                                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                                                    style={{ background: `${sInfo.color}20`, color: sInfo.color }}
                                                >
                                                    {sInfo.label}
                                                </span>
                                                <span
                                                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
                                                    style={{ background: `${pInfo.color}20`, color: pInfo.color }}
                                                >
                                                    {pInfo.label}
                                                </span>
                                            </div>
                                            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>{t.message}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="text-[10px]" style={{ color: "var(--fg-faint)" }}>
                                                    {t.owner?.name || t.owner?.email || "—"} • {formatDateTimeVi(t.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            {isActive ? (
                                                <div className="flex items-center gap-1">
                                                    {t.status !== "in_progress" && (
                                                        <button onClick={() => updateTicketStatus(t.id, "in_progress")} disabled={saving}
                                                            className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#f59e0b20", color: "#f59e0b" }}>
                                                            🔄 Xử lý
                                                        </button>
                                                    )}
                                                    {t.status !== "done" && (
                                                        <button onClick={() => updateTicketStatus(t.id, "done")} disabled={saving}
                                                            className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#10b98120", color: "#10b981" }}>
                                                            ✅ Xong
                                                        </button>
                                                    )}
                                                    {t.status === "done" && (
                                                        <button onClick={() => updateTicketStatus(t.id, "open")} disabled={saving}
                                                            className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: "#3b82f620", color: "#3b82f6" }}>
                                                            🔁 Mở lại
                                                        </button>
                                                    )}
                                                    <button onClick={() => setActiveTicketId(null)}
                                                        className="px-2 py-1 rounded text-xs" style={{ color: "var(--fg-muted)" }}>✕</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setActiveTicketId(t.id)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                    style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                                                    ⚡ Thao tác
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
