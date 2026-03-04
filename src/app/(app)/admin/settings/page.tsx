"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, fetchMe, getToken } from "@/lib/auth-client";
import { hasUiPermission } from "@/lib/ui-permissions";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type FeatureSetting = {
    id: string;
    key: string;
    enabled: boolean;
    config: unknown;
    updatedAt: string;
};

type BranchItem = {
    id: string;
    name: string;
    code: string | null;
    provinces: string[];
    isActive: boolean;
};

const FEATURE_DEFINITIONS: Record<string, { label: string; description: string; icon: string }> = {
    auto_assign_by_province: {
        label: "Tự động phân data theo tỉnh",
        description: "Khi bật, lead mới từ landing page sẽ tự động được gán cho chi nhánh phù hợp (theo tỉnh thành) và round-robin cho nhân viên trong chi nhánh đó.",
        icon: "🔀",
    },
};

function parseApiError(error: ApiClientError) {
    return `${error.code}: ${error.message}`;
}

export default function AdminSettingsPage() {
    const toast = useToast();
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [allowed, setAllowed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [settings, setSettings] = useState<FeatureSetting[]>([]);
    const [branches, setBranches] = useState<BranchItem[]>([]);
    const [editBranch, setEditBranch] = useState<BranchItem | null>(null);
    const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
    const [branchSaving, setBranchSaving] = useState(false);
    const [deletingBranch, setDeletingBranch] = useState<string | null>(null);
    const [tuitionProvinces, setTuitionProvinces] = useState<string[]>([]);

    useEffect(() => {
        fetchMe()
            .then((data) => {
                const ok = hasUiPermission(data.user.permissions, "admin_automation_admin", "VIEW");
                setAllowed(ok);
            })
            .catch(() => clearToken())
            .finally(() => setCheckingAccess(false));
    }, []);

    const loadSettings = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        const data = await fetchJson<{ items: FeatureSetting[] }>("/api/admin/settings", { token });
        setSettings(data.items || []);
    }, []);

    const loadBranches = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const data = await fetchJson<{ items: BranchItem[] }>("/api/admin/branches?page=1&pageSize=100", { token });
            setBranches(data.items || []);
        } catch {
            setBranches([]);
        }
    }, []);

    const loadTuitionProvinces = useCallback(async () => {
        try {
            const data = await fetchJson<{ items: { province: string }[] }>("/api/public/tuition-plans");
            const uniqueProvinces = [...new Set((data.items || []).map((p) => p.province))].sort();
            setTuitionProvinces(uniqueProvinces);
        } catch {
            setTuitionProvinces([]);
        }
    }, []);

    useEffect(() => {
        if (!allowed) return;
        setLoading(true);
        Promise.all([loadSettings(), loadBranches(), loadTuitionProvinces()])
            .catch((e) => setError(`Lỗi tải dữ liệu: ${parseApiError(e as ApiClientError)}`))
            .finally(() => setLoading(false));
    }, [allowed, loadSettings, loadBranches, loadTuitionProvinces]);

    async function toggleFeature(key: string, enabled: boolean) {
        const token = getToken();
        if (!token) return;
        setSaving(key);
        setError("");
        try {
            await fetchJson("/api/admin/settings", {
                method: "POST",
                token,
                body: { key, enabled },
            });
            toast.success(`${enabled ? "Đã bật" : "Đã tắt"} tính năng.`);
            await loadSettings();
        } catch (e) {
            setError(parseApiError(e as ApiClientError));
        } finally {
            setSaving(null);
        }
    }

    function getSettingValue(key: string) {
        return settings.find((s) => s.key === key);
    }

    function openBranchEdit(branch: BranchItem) {
        setEditBranch(branch);
        setSelectedProvinces(branch.provinces || []);
    }

    function toggleProvince(province: string) {
        setSelectedProvinces((prev) =>
            prev.includes(province) ? prev.filter((p) => p !== province) : [...prev, province]
        );
    }

    async function saveBranchProvinces() {
        if (!editBranch) return;
        const token = getToken();
        if (!token) return;
        setBranchSaving(true);
        setError("");
        try {
            await fetchJson(`/api/admin/branches/${editBranch.id}`, {
                method: "PATCH",
                token,
                body: { provinces: selectedProvinces },
            });
            toast.success("Đã lưu tỉnh thành cho chi nhánh.");
            setEditBranch(null);
            await loadBranches();
        } catch (e) {
            setError(parseApiError(e as ApiClientError));
        } finally {
            setBranchSaving(false);
        }
    }

    async function deleteBranch(branch: BranchItem) {
        if (!confirm(`Bạn chắc chắn muốn xóa chi nhánh "${branch.name}"?\nThao tác này không thể hoàn tác.`)) return;
        const token = getToken();
        if (!token) return;
        setDeletingBranch(branch.id);
        setError("");
        try {
            await fetchJson(`/api/admin/branches/${branch.id}`, {
                method: "DELETE",
                token,
            });
            toast.success(`Đã xóa chi nhánh "${branch.name}".`);
            await loadBranches();
        } catch (e) {
            const err = e as ApiClientError;
            toast.error(err.message || "Không thể xóa chi nhánh.");
        } finally {
            setDeletingBranch(null);
        }
    }

    if (checkingAccess) {
        return (
            <div className="flex items-center gap-2 text-[color:var(--fg)]">
                <Spinner /> Đang kiểm tra quyền...
            </div>
        );
    }

    if (!allowed) {
        return <Alert type="error" message="Bạn không có quyền truy cập" />;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">                <div className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">⚙️</div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Cài đặt tính năng</h2>
                        <p className="text-sm text-[color:var(--fg-muted)]">Bật/tắt tính năng nâng cao, thiết lập phân data chi nhánh</p>
                    </div>
                </div>
            </div>

            {error ? <Alert type="error" message={error} /> : null}
            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-[var(--bg-elevated)]" />)}
                </div>
            ) : null}

            {/* Feature Toggles */}
            {!loading && Object.entries(FEATURE_DEFINITIONS).map(([key, def]) => {
                const setting = getSettingValue(key);
                const enabled = setting?.enabled || false;
                const isSaving = saving === key;

                return (
                    <div key={key} className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                        <div className={`h-1 bg-gradient-to-r ${enabled ? "from-emerald-500 to-teal-500" : "from-zinc-300 to-zinc-400"}`} />
                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${enabled ? "bg-[var(--success-bg)]" : "bg-[var(--bg-inset)]"}`}>
                                    {def.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-[color:var(--fg)]">{def.label}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${enabled ? "bg-[var(--success-bg)] text-[color:var(--success-fg)]" : "bg-[var(--bg-inset)] text-[color:var(--fg-muted)]"}`}>
                                            {enabled ? "BẬT" : "TẮT"}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-[color:var(--fg-muted)]">{def.description}</p>
                                </div>
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => toggleFeature(key, !enabled)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? "bg-[var(--success-bg)]0" : "bg-zinc-300"} ${isSaving ? "opacity-50" : ""}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--card-bg)] shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Branch-Province Mapping */}
            {!loading && (
                <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>                    <div className="p-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[color:var(--fg)]">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-sm">🏢</span>
                            Quản lý chi nhánh → Tỉnh thành
                        </h3>
                        <p className="mt-1 text-xs text-[color:var(--fg-muted)]">
                            Chọn tỉnh thành (từ bảng giá) cho mỗi chi nhánh. Admin có thể xóa chi nhánh không dùng.
                        </p>

                        <div className="mt-3 space-y-2">
                            {branches.map((branch) => (
                                <div key={branch.id} className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]/50 p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-[color:var(--fg)]">{branch.name}</p>
                                                {branch.code && (
                                                    <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--fg-secondary)]">{branch.code}</span>
                                                )}
                                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${branch.isActive ? "bg-[var(--success-bg)] text-[color:var(--success-fg)]" : "bg-[var(--danger-bg)] text-[color:var(--danger)]"}`}>
                                                    {branch.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {branch.provinces && branch.provinces.length > 0
                                                    ? branch.provinces.map((p) => (
                                                        <span key={p} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-[color:var(--accent)]">{p}</span>
                                                    ))
                                                    : <span className="text-xs text-[color:var(--fg-muted)] italic">Chưa thiết lập tỉnh thành</span>}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 gap-1.5">
                                            <Button variant="secondary" className="!text-xs !px-2.5" onClick={() => openBranchEdit(branch)}>
                                                ✏️ Sửa
                                            </Button>
                                            <button
                                                type="button"
                                                disabled={deletingBranch === branch.id}
                                                onClick={() => deleteBranch(branch)}
                                                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--danger-bg)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--danger)] transition hover:bg-[var(--danger-bg)] disabled:opacity-50"
                                            >
                                                {deletingBranch === branch.id ? "…" : "🗑️ Xóa"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {branches.length === 0 ? (
                                <p className="text-sm text-[color:var(--fg-muted)] text-center py-4">Chưa có chi nhánh nào.</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Branch Provinces Modal – Checkbox picker from TuitionPlan provinces */}
            {editBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setEditBranch(null)}>
                    <div className="mx-4 w-full max-w-md glass-2 rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-base font-bold text-[color:var(--fg)]">Chọn tỉnh: {editBranch.name}</h3>
                        <p className="mt-1 text-xs text-[color:var(--fg-muted)]">Chọn tỉnh thành từ bảng giá cho chi nhánh này</p>

                        {tuitionProvinces.length > 0 ? (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {tuitionProvinces.map((province) => {
                                    const isSelected = selectedProvinces.includes(province);
                                    return (
                                        <button
                                            key={province}
                                            type="button"
                                            onClick={() => toggleProvince(province)}
                                            className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${isSelected
                                                    ? "border-blue-500 bg-[var(--accent-bg)] text-[color:var(--accent)] ring-1 ring-blue-500/30"
                                                    : "border-[var(--border-subtle)] bg-[var(--card-bg)] text-[color:var(--fg)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]"
                                                }`}
                                        >
                                            <span className="mr-1.5">{isSelected ? "✅" : "⬜"}</span>
                                            {province}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-[color:var(--fg-muted)]">Chưa có tỉnh nào trong bảng giá. Vui lòng thêm bảng giá trước.</p>
                        )}

                        {selectedProvinces.length > 0 && (
                            <p className="mt-2 text-xs text-[color:var(--fg-muted)]">
                                Đã chọn: <span className="font-medium text-[color:var(--accent)]">{selectedProvinces.join(", ")}</span>
                            </p>
                        )}

                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setEditBranch(null)}>Huỷ</Button>
                            <Button onClick={saveBranchProvinces} disabled={branchSaving}>
                                {branchSaving ? "Đang lưu..." : "Lưu"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
