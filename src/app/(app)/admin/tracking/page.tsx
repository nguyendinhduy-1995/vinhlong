"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, getToken } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { formatDateVi } from "@/lib/date-utils";

type TrackingCode = {
    id: string;
    site: string;
    key: string;
    name: string;
    placement: "HEAD" | "BODY_TOP" | "BODY_BOTTOM";
    code: string;
    isEnabled: boolean;
    updatedAt: string;
};

const SITES = ["ALL", "GLOBAL", "LANDING", "CRM", "STUDENT", "TAPLAI"] as const;
const SITE_OPTIONS = ["GLOBAL", "LANDING", "CRM", "STUDENT", "TAPLAI"] as const;
const PLACEMENT_LABELS: Record<string, string> = { HEAD: "HEAD", BODY_TOP: "BODY (đầu)", BODY_BOTTOM: "BODY (cuối)" };
const SITE_LABELS: Record<string, string> = { GLOBAL: "🌐 Global", LANDING: "🏠 Landing", CRM: "💼 CRM", STUDENT: "🎓 Student", TAPLAI: "🚗 Taplai" };

export default function AdminTrackingPage() {
    const router = useRouter();
    const toast = useToast();
    const [items, setItems] = useState<TrackingCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [siteFilter, setSiteFilter] = useState("ALL");
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<TrackingCode | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<TrackingCode | null>(null);
    const [cloneTarget, setCloneTarget] = useState<TrackingCode | null>(null);
    const [cloneSite, setCloneSite] = useState("LANDING");
    const [form, setForm] = useState({ site: "GLOBAL", key: "", name: "", placement: "HEAD" as string, code: "", isEnabled: true });

    const handleAuthError = useCallback((err: ApiClientError) => {
        if (err.code === "AUTH_MISSING_BEARER" || err.code === "AUTH_INVALID_TOKEN") { clearToken(); router.replace("/login"); return true; }
        return false;
    }, [router]);

    const load = useCallback(async () => {
        const token = getToken(); if (!token) return;
        setLoading(true); setError("");
        try {
            const data = await fetchJson<{ items: TrackingCode[] }>(`/api/admin/tracking-codes?site=${siteFilter}`, { token });
            setItems(data.items);
        } catch (e) { const err = e as ApiClientError; if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`); }
        finally { setLoading(false); }
    }, [handleAuthError, siteFilter]);

    useEffect(() => { void load(); }, [load]);

    async function save() {
        const token = getToken(); if (!token) return; setError("");
        try {
            if (editing) {
                await fetchJson(`/api/admin/tracking-codes/${editing.id}`, { method: "PATCH", token, body: { name: form.name, placement: form.placement, code: form.code, isEnabled: form.isEnabled } });
                toast.success("Đã cập nhật.");
            } else {
                await fetchJson("/api/admin/tracking-codes", { method: "POST", token, body: form });
                toast.success("Đã tạo mã tracking.");
            }
            setOpenForm(false); setEditing(null); resetForm(); await load();
        } catch (e) { const err = e as ApiClientError; if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`); }
    }

    async function toggleEnabled(item: TrackingCode) {
        const token = getToken(); if (!token) return;
        try {
            await fetchJson(`/api/admin/tracking-codes/${item.id}`, { method: "PATCH", token, body: { isEnabled: !item.isEnabled } });
            toast.success(item.isEnabled ? "Đã tắt" : "Đã bật"); await load();
        } catch (e) { const err = e as ApiClientError; if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`); }
    }

    async function deleteCode(item: TrackingCode) {
        const token = getToken(); if (!token) return;
        try {
            await fetchJson(`/api/admin/tracking-codes/${item.id}`, { method: "DELETE", token });
            toast.success("Đã xóa."); setConfirmDelete(null); await load();
        } catch (e) { const err = e as ApiClientError; if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`); }
    }

    async function cloneToSite() {
        if (!cloneTarget) return;
        const token = getToken(); if (!token) return; setError("");
        try {
            let newKey = cloneTarget.key;
            // Check if key exists in target site, auto-suffix
            const existing = items.find((i) => i.site === cloneSite && i.key === newKey);
            if (existing) newKey = `${newKey}_2`;

            await fetchJson("/api/admin/tracking-codes", {
                method: "POST", token,
                body: { site: cloneSite, key: newKey, name: cloneTarget.name, placement: cloneTarget.placement, code: cloneTarget.code, isEnabled: false },
            });
            toast.success(`Đã clone sang ${SITE_LABELS[cloneSite] || cloneSite}`);
            setCloneTarget(null); await load();
        } catch (e) { const err = e as ApiClientError; if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`); }
    }

    function resetForm() { setForm({ site: "GLOBAL", key: "", name: "", placement: "HEAD", code: "", isEnabled: true }); }
    function copyCode(code: string) { navigator.clipboard.writeText(code).then(() => toast.success("Đã copy")); }

    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">                <div className="relative flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">📡</div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Quản lý mã Tracking</h2>
                        <p className="text-sm text-[color:var(--fg-muted)]">Google Tag, Meta Pixel, TikTok Pixel… — multi-site</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={siteFilter}
                            onChange={(e) => setSiteFilter(e.target.value)}
                            className="rounded-xl border border-white/30 bg-[var(--bg-elevated)] px-3 py-2 text-sm text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                        >
                            {SITES.map((s) => <option key={s} value={s} className="text-[color:var(--fg)]">{s === "ALL" ? "🔍 Tất cả sites" : SITE_LABELS[s]}</option>)}
                        </select>
                        <Button variant="secondary" onClick={load} disabled={loading} >
                            {loading ? "..." : "🔄"}
                        </Button>
                        <Button onClick={() => { setEditing(null); resetForm(); setOpenForm(true); }} >
                            ➕ Thêm
                        </Button>
                    </div>
                </div>
            </div>

            {error ? <Alert type="error" message={error} /> : null}

            {/* ── Table ── */}
            {loading ? (
                <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 surface rounded-xl p-3">
                            <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)]" />
                            <div className="flex-1 space-y-2"><div className="h-4 w-1/3 rounded bg-[var(--bg-elevated)]" /><div className="h-3 w-1/4 rounded bg-[var(--bg-inset)]" /></div>
                            <div className="h-6 w-16 rounded-full bg-[var(--bg-elevated)]" />
                        </div>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-xl bg-[var(--card-bg)] p-6 text-sm text-[color:var(--fg-secondary)] shadow-sm">Chưa có mã tracking nào. Nhấn &quot;Thêm&quot; để bắt đầu.</div>
            ) : (
                <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>                    <Table headers={["Site", "Tên", "Key", "Vị trí", "Trạng thái", "Cập nhật", "Hành động"]}>
                        {items.map((item, idx) => (
                            <tr key={item.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${80 + Math.min(idx * 30, 200)}ms` }}>
                                <td className="px-3 py-2">
                                    <span className="inline-flex items-center rounded-full bg-[var(--bg-inset)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--fg-secondary)]">{SITE_LABELS[item.site] || item.site}</span>
                                </td>
                                <td className="px-3 py-2 text-sm font-medium text-[color:var(--fg)]">{item.name}</td>
                                <td className="px-3 py-2"><code className="rounded bg-[var(--bg-inset)] px-1.5 py-0.5 text-xs text-[color:var(--fg-secondary)]">{item.key}</code></td>
                                <td className="px-3 py-2 text-sm text-[color:var(--fg)]">{PLACEMENT_LABELS[item.placement]}</td>
                                <td className="px-3 py-2">
                                    <button onClick={() => toggleEnabled(item)} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${item.isEnabled ? "bg-[var(--success-bg)] text-[color:var(--success-fg)] hover:bg-[var(--success-bg)]" : "bg-[var(--bg-inset)] text-[color:var(--fg-muted)] hover:bg-[var(--hover-active)]"}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${item.isEnabled ? "bg-[var(--success-bg)]0" : "bg-zinc-400"}`} />
                                        {item.isEnabled ? "Bật" : "Tắt"}
                                    </button>
                                </td>
                                <td className="px-3 py-2 text-xs text-[color:var(--fg-muted)]">{formatDateVi(item.updatedAt)}</td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-1">
                                        <Button variant="secondary" className="h-7 px-2 py-1 text-xs" onClick={() => { setEditing(item); setForm({ site: item.site, key: item.key, name: item.name, placement: item.placement, code: item.code, isEnabled: item.isEnabled }); setOpenForm(true); }}>✏️</Button>
                                        <Button variant="secondary" className="h-7 px-2 py-1 text-xs" onClick={() => copyCode(item.code)}>📋</Button>
                                        <Button variant="secondary" className="h-7 px-2 py-1 text-xs" onClick={() => { setCloneTarget(item); setCloneSite(item.site === "GLOBAL" ? "LANDING" : "GLOBAL"); }}>📑</Button>
                                        <Button variant="secondary" className="h-7 px-2 py-1 text-xs !text-[color:var(--danger)] hover:!bg-[var(--danger-bg)]" onClick={() => setConfirmDelete(item)}>🗑️</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* ── Create/Edit Modal ── */}
            <Modal open={openForm} title={editing ? "Cập nhật mã tracking" : "Thêm mã tracking"} onClose={() => setOpenForm(false)}>
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-[color:var(--fg-secondary)]">Site</label>
                        <Select value={form.site} onChange={(e) => setForm((p) => ({ ...p, site: e.target.value }))} disabled={!!editing}>
                            {SITE_OPTIONS.map((s) => <option key={s} value={s}>{SITE_LABELS[s]}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-[color:var(--fg-secondary)]">Tên hiển thị</label>
                        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="VD: Google Tag Manager" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-[color:var(--fg-secondary)]">Key {editing ? "(không thể sửa)" : ""}</label>
                        <Input value={form.key} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))} placeholder="VD: google_tag" disabled={!!editing} className={editing ? "!bg-[var(--bg-inset)] !text-[color:var(--fg-muted)]" : ""} />
                        {!editing && <p className="mt-0.5 text-[10px] text-[color:var(--fg-muted)]">Chỉ chữ thường, số và dấu gạch dưới (_)</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-[color:var(--fg-secondary)]">Vị trí chèn</label>
                        <Select value={form.placement} onChange={(e) => setForm((p) => ({ ...p, placement: e.target.value }))}>
                            <option value="HEAD">HEAD</option>
                            <option value="BODY_TOP">BODY (đầu trang)</option>
                            <option value="BODY_BOTTOM">BODY (cuối trang)</option>
                        </Select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-[color:var(--fg-secondary)]">Mã snippet</label>
                        <textarea className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs leading-relaxed focus:border-teal-400 focus:ring-2 focus:ring-teal-100" rows={10} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="Dán mã tracking tại đây..." spellCheck={false} />
                        <p className="mt-0.5 text-[10px] text-[color:var(--fg-muted)]">Tối đa 50.000 ký tự</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[color:var(--fg)]">
                        <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm((p) => ({ ...p, isEnabled: e.target.checked }))} />
                        Bật (hiện trên {SITE_LABELS[form.site] || form.site})
                    </label>
                    <div className={`rounded-2xl border px-3 py-2 text-xs ${form.isEnabled ? "border-green-200 bg-[var(--success-bg)] text-[color:var(--success-fg)]" : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[color:var(--fg-muted)]"}`}>
                        {form.isEnabled ? "🟢" : "⚫"} Trạng thái: <strong>{form.isEnabled ? "ON" : "OFF"}</strong> — {SITE_LABELS[form.site] || form.site}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="secondary" onClick={() => setOpenForm(false)}>Hủy</Button>
                        <Button onClick={save}>💾 Lưu</Button>
                    </div>
                </div>
            </Modal>

            {/* ── Delete Confirmation ── */}
            <Modal open={!!confirmDelete} title="Xác nhận xóa" onClose={() => setConfirmDelete(null)}>
                <div className="space-y-3">
                    <p className="text-sm text-[color:var(--fg)]">Xóa <strong>{confirmDelete?.name}</strong> ({confirmDelete?.site}/{confirmDelete?.key})?</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Hủy</Button>
                        <Button className="!bg-red-600 hover:!bg-red-700" onClick={() => confirmDelete && deleteCode(confirmDelete)}>🗑️ Xóa</Button>
                    </div>
                </div>
            </Modal>

            {/* ── Clone Modal ── */}
            <Modal open={!!cloneTarget} title="Clone sang site khác" onClose={() => setCloneTarget(null)}>
                <div className="space-y-3">
                    <p className="text-sm text-[color:var(--fg)]">Clone <strong>{cloneTarget?.name}</strong> (<code className="text-xs">{cloneTarget?.key}</code>) sang:</p>
                    <Select value={cloneSite} onChange={(e) => setCloneSite(e.target.value)}>
                        {SITE_OPTIONS.filter((s) => s !== cloneTarget?.site).map((s) => <option key={s} value={s}>{SITE_LABELS[s]}</option>)}
                    </Select>
                    <p className="text-[10px] text-[color:var(--fg-muted)]">Nếu key trùng sẽ tự thêm hậu tố _2. Record mới sẽ ở trạng thái tắt.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setCloneTarget(null)}>Hủy</Button>
                        <Button onClick={cloneToSite}>📑 Clone</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
