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
    leadId: string | null;
    studentId: string | null;
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

/* ── Main ── */
export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState("");
    const [showForm, setShowForm] = useState(false);

    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    }, []);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchJson<{ items: Ticket[] }>("/api/tasks?scope=SUPPORT&pageSize=50");
            setTickets(res.items);
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const submitTicket = useCallback(async () => {
        if (!title.trim() || !message.trim()) {
            showToast("Vui lòng nhập tiêu đề và nội dung");
            return;
        }
        setSaving(true);
        try {
            await fetchJson("/api/tasks", {
                method: "POST",
                body: JSON.stringify({
                    scope: "SUPPORT",
                    title: title.trim(),
                    message: message.trim(),
                    priority,
                    type: "TASK",
                }),
            });
            showToast("✅ Đã gửi yêu cầu hỗ trợ");
            setTitle("");
            setMessage("");
            setPriority("MEDIUM");
            setShowForm(false);
            fetchTickets();
        } catch {
            showToast("❌ Lỗi khi gửi");
        }
        setSaving(false);
    }, [title, message, priority, fetchTickets, showToast]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>🎫 Hỗ trợ</h1>
                    <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>Gửi yêu cầu khi cần giúp đỡ hoặc gặp vấn đề</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: "var(--accent)" }}
                >
                    {showForm ? "✕ Đóng" : "➕ Tạo ticket"}
                </button>
            </div>

            {/* Submission Form */}
            {showForm && (
                <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-hairline)" }}>
                    <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>Tạo yêu cầu hỗ trợ mới</h3>
                    <div>
                        <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Tiêu đề *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="VD: Không thể assign lead, Học viên cần đổi lịch..."
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border-hairline)" }}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Nội dung *</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Mô tả chi tiết vấn đề bạn đang gặp..."
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                            style={{ background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border-hairline)" }}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium block mb-1" style={{ color: "var(--fg-muted)" }}>Mức ưu tiên</label>
                        <div className="flex gap-2">
                            {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                        background: priority === p ? PRIORITY_LABELS[p].color : "var(--bg)",
                                        color: priority === p ? "white" : "var(--fg-secondary)",
                                        border: "1px solid var(--border-hairline)",
                                    }}
                                >
                                    {PRIORITY_LABELS[p].icon} {PRIORITY_LABELS[p].label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={submitTicket}
                        disabled={saving}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: "var(--accent)", opacity: saving ? 0.6 : 1 }}
                    >
                        {saving ? "Đang gửi..." : "📩 Gửi yêu cầu"}
                    </button>
                </div>
            )}

            {/* Ticket List */}
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-hairline)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-hairline)", background: "var(--bg-inset)" }}>
                    <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Ticket của bạn ({tickets.length})</span>
                </div>
                {loading ? (
                    <div className="p-8 text-center" style={{ color: "var(--fg-muted)" }}>Đang tải...</div>
                ) : tickets.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: "var(--fg-muted)" }}>
                        Chưa có ticket nào. Bấm &quot;Tạo ticket&quot; để gửi yêu cầu hỗ trợ.
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border-hairline)" }}>
                        {tickets.map((t) => {
                            const pInfo = PRIORITY_LABELS[t.priority] || PRIORITY_LABELS.MEDIUM;
                            const sInfo = STATUS_LABELS[t.status] || STATUS_LABELS.open;
                            return (
                                <div key={t.id} className="px-4 py-3 flex items-start gap-3">
                                    <span className="text-lg mt-0.5">{pInfo.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{t.title}</span>
                                            <span
                                                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                                style={{ background: `${sInfo.color}20`, color: sInfo.color }}
                                            >
                                                {sInfo.label}
                                            </span>
                                        </div>
                                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--fg-muted)" }}>{t.message}</p>
                                        <span className="text-[10px] mt-1 block" style={{ color: "var(--fg-faint)" }}>{formatDateTimeVi(t.createdAt)}</span>
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
