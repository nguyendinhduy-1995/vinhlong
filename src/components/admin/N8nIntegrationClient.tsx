"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, fetchMe, getToken } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/admin-auth";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { CopyButton, DownloadButton } from "@/components/admin/CopyButton";

/* ── Types ── */

type WorkflowListItem = {
    id: string;
    title: string;
    type: "sub-workflow" | "cron" | "webhook" | "interval";
    docFilename: string | null;
    jsonFilename: string | null;
};

type WorkflowDetail = {
    id: string;
    docMarkdown: string | null;
    workflowJson: unknown;
    workflowJsonRaw: string | null;
};

const TYPE_LABELS: Record<WorkflowListItem["type"], string> = {
    "sub-workflow": "Sub-workflow",
    cron: "Cron",
    webhook: "Webhook",
    interval: "Interval",
};

const TYPE_COLORS: Record<WorkflowListItem["type"], string> = {
    "sub-workflow": "bg-violet-100 text-violet-700",
    cron: "bg-blue-100 text-blue-700",
    webhook: "bg-amber-100 text-[color:var(--warning-fg)]",
    interval: "bg-[var(--success-bg)] text-[color:var(--success-fg)]",
};

const ENV_TEMPLATE = `# === N8N Environment Variables ===
# Paste into N8N Settings → Environment Variables

CRM_BASE_URL=
CRM_EMAIL=
CRM_PASSWORD=
CRON_SECRET=
WORKER_SECRET=
OPS_SECRET=
MARKETING_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ZALO_OA_ACCESS_TOKEN=
FB_PAGE_TOKEN=
FB_AD_ACCOUNT_ID=
FB_ACCESS_TOKEN=
OPENAI_API_KEY=`;

const IMPORT_STEPS = `Hướng dẫn import workflow vào N8N:

1. Mở N8N Dashboard → Workflows → Import from File (hoặc URL)
2. Chọn file .json vừa tải về (hoặc paste JSON)
3. Click "Import" → workflow sẽ hiện trên canvas
4. Kiểm tra các node → đảm bảo dùng $env cho credentials
5. Bật workflow (toggle Active ở góc trên phải)

⚠️ Thứ tự import:
   1) S1 Get Bearer Token
   2) S2 Alert Admin
   3) S3 Standard Logger
   4) Các workflow chính 01-08 (vì chúng gọi sub-workflows)

⚠️ Sau khi import sub-workflows, lấy workflow ID
   và cập nhật trong các node "executeWorkflow" của workflow chính.`;

/* ── Overview Panel ── */

function OverviewPanel() {
    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Setup Checklist */}
            <section className="rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
                <div className="p-5 space-y-4">
                    <h3 className="text-base font-semibold text-[color:var(--fg)] flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-lg">📋</span>
                        Checklist setup N8N
                    </h3>
                    <div className="space-y-2 text-sm text-[color:var(--fg)]">
                        <p className="font-medium text-[color:var(--fg)]">1. Cài đặt biến môi trường:</p>
                        <p className="text-xs text-[color:var(--fg-muted)] ml-4">Tất cả secrets đều dùng <code className="bg-[var(--bg-inset)] px-1 rounded">$env</code> trong workflow JSON. Không paste giá trị thật vào JSON!</p>
                    </div>
                    {/* Env Template */}
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-zinc-900 p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-[color:var(--fg-muted)]">N8N Env Template</span>
                            <CopyButton text={ENV_TEMPLATE} label="Copy Env Template" icon="📄" />
                        </div>
                        <pre className="text-xs text-emerald-300 whitespace-pre-wrap leading-5">{ENV_TEMPLATE}</pre>
                    </div>

                    <div className="space-y-2 text-sm text-[color:var(--fg)]">
                        <p className="font-medium text-[color:var(--fg)]">2. Thứ tự import đúng:</p>
                        <ol className="ml-4 space-y-1 text-xs list-decimal list-inside">
                            <li><strong>Sub-workflows:</strong> S1 Get Bearer Token → S2 Alert Admin → S3 Standard Logger</li>
                            <li><strong>Workflows chính:</strong> 01 → 08 (theo thứ tự)</li>
                        </ol>
                    </div>

                    <div className="space-y-2 text-sm text-[color:var(--fg)]">
                        <p className="font-medium text-[color:var(--fg)]">3. Verify setup:</p>
                        <div className="flex items-center gap-2">
                            <code className="rounded-lg bg-[var(--bg-inset)] px-3 py-1.5 text-xs font-mono">npm run n8n:verify</code>
                            <CopyButton text="npm run n8n:verify" label="Copy" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Endpoint Groups */}
            <section className="rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <div className="p-5 space-y-4">
                    <h3 className="text-base font-semibold text-[color:var(--fg)] flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-lg">🔑</span>
                        Endpoint Groups
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-[var(--border-subtle)] text-left">
                                    <th className="px-3 py-2 font-semibold text-[color:var(--fg)]">Group</th>
                                    <th className="px-3 py-2 font-semibold text-[color:var(--fg)]">Auth</th>
                                    <th className="px-3 py-2 font-semibold text-[color:var(--fg)]">Endpoints</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                <tr className="hover:bg-[var(--bg-elevated)] transition-colors">
                                    <td className="px-3 py-2"><span className="rounded-full bg-[var(--success-bg)] px-2 py-0.5 text-[color:var(--success-fg)] font-medium">Public</span></td>
                                    <td className="px-3 py-2 text-[color:var(--fg-secondary)]">Không cần auth</td>
                                    <td className="px-3 py-2 font-mono text-[color:var(--fg)]">/api/public/lead</td>
                                </tr>
                                <tr className="hover:bg-[var(--bg-elevated)] transition-colors">
                                    <td className="px-3 py-2"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[color:var(--warning-fg)] font-medium">Service Secret</span></td>
                                    <td className="px-3 py-2 text-[color:var(--fg-secondary)]">x-*-secret header</td>
                                    <td className="px-3 py-2 font-mono text-[color:var(--fg)]">
                                        /api/cron/daily, /api/worker/outbound, /api/ops/pulse, /api/marketing/report
                                    </td>
                                </tr>
                                <tr className="hover:bg-[var(--bg-elevated)] transition-colors">
                                    <td className="px-3 py-2"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 font-medium">Bearer Token</span></td>
                                    <td className="px-3 py-2 text-[color:var(--fg-secondary)]">Authorization: Bearer</td>
                                    <td className="px-3 py-2 font-mono text-[color:var(--fg)]">
                                        /api/auth/login, /api/leads/stale, /api/leads/auto-assign, /api/ai/suggestions, /api/kpi/targets
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Security Warning */}
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--danger-bg)]/50 p-4">
                <div className="flex gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="text-sm text-[color:var(--danger-fg)] space-y-1">
                        <p className="font-semibold">Lưu ý bảo mật</p>
                        <p>Không bao giờ paste secret thật vào workflow JSON. Tất cả workflow sử dụng <code className="bg-rose-100 px-1 rounded font-mono text-xs">{"{{ $env.VARIABLE_NAME }}"}</code> — chỉ cần set env trong N8N Settings.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ── Workflow Detail Panel ── */

function WorkflowDetailPanel({ detail, loading }: { detail: WorkflowDetail | null; loading: boolean }) {
    const [activeTab, setActiveTab] = useState<"docs" | "json" | "curl">("docs");

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner /> <span className="ml-2 text-sm text-[color:var(--fg-secondary)]">Đang tải...</span>
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="flex items-center justify-center py-20 text-[color:var(--fg-muted)] text-sm">
                Chọn một workflow từ danh sách bên trái để xem chi tiết
            </div>
        );
    }

    const jsonPretty = detail.workflowJson ? JSON.stringify(detail.workflowJson, null, 2) : null;

    // Extract mermaid blocks from markdown
    const mermaidBlocks: string[] = [];
    if (detail.docMarkdown) {
        const regex = /```mermaid\n([\s\S]*?)```/g;
        let match;
        while ((match = regex.exec(detail.docMarkdown)) !== null) {
            mermaidBlocks.push(match[1].trim());
        }
    }

    // Extract curl samples from markdown
    const curlBlocks: string[] = [];
    if (detail.docMarkdown) {
        const curlRegex = /```(?:bash|sh)?\n(curl[\s\S]*?)```/g;
        let match;
        while ((match = curlRegex.exec(detail.docMarkdown)) !== null) {
            curlBlocks.push(match[1].trim());
        }
    }

    const tabs = [
        { key: "docs" as const, label: "📖 Tài liệu", show: !!detail.docMarkdown },
        { key: "json" as const, label: "📦 JSON", show: !!jsonPretty },
        { key: "curl" as const, label: "🧪 Curl & Mermaid", show: curlBlocks.length > 0 || mermaidBlocks.length > 0 },
    ].filter((t) => t.show);

    return (
        <div className="space-y-4 animate-fade-in-up">
            {/* Header */}
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-[color:var(--fg)]">{detail.id}</h3>
                        {(() => {
                            const wf = detail.workflowJson as Record<string, unknown> | null;
                            const name = wf && typeof wf === "object" && typeof wf.name === "string" ? wf.name : null;
                            return name ? <span className="text-sm text-[color:var(--fg-secondary)]">— {name}</span> : null;
                        })()}
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            {tabs.length > 1 && (
                <div className="flex gap-1 rounded-xl bg-[var(--bg-inset)] p-1">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setActiveTab(t.key)}
                            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${activeTab === t.key ? "bg-white text-[color:var(--fg)] shadow-sm" : "text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Docs tab */}
            {activeTab === "docs" && detail.docMarkdown && (
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm overflow-hidden">
                    <div className="p-5 prose prose-sm prose-zinc max-w-none prose-headings:text-[color:var(--fg)] prose-code:bg-[var(--bg-inset)] prose-code:px-1 prose-code:rounded prose-code:text-xs prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-table:text-xs prose-th:text-left prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    const lang = match?.[1];
                                    const content = String(children).replace(/\n$/, "");

                                    if (lang === "mermaid") {
                                        return (
                                            <div className="relative my-3">
                                                <div className="flex items-center justify-between rounded-t-lg bg-zinc-800 px-3 py-1.5">
                                                    <span className="text-[10px] font-medium text-[color:var(--fg-muted)]">mermaid diagram</span>
                                                    <CopyButton text={content} label="Copy Mermaid" />
                                                </div>
                                                <pre className="!mt-0 !rounded-t-none text-xs leading-5">{content}</pre>
                                            </div>
                                        );
                                    }

                                    if (lang) {
                                        return (
                                            <div className="relative my-3">
                                                <div className="flex items-center justify-between rounded-t-lg bg-zinc-800 px-3 py-1.5">
                                                    <span className="text-[10px] font-medium text-[color:var(--fg-muted)]">{lang}</span>
                                                    <CopyButton text={content} label="Copy" />
                                                </div>
                                                <pre className="!mt-0 !rounded-t-none text-xs leading-5">{content}</pre>
                                            </div>
                                        );
                                    }

                                    return <code className={className} {...props}>{children}</code>;
                                },
                            }}
                        >
                            {detail.docMarkdown}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* JSON tab */}
            {activeTab === "json" && jsonPretty && (
                <div className="rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm overflow-hidden">
                    <div className="p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <CopyButton text={jsonPretty} label="Copy JSON" icon="📋" />
                            <DownloadButton content={jsonPretty} filename={`${detail.id}.json`} label="Download .json" />
                            <CopyButton text={IMPORT_STEPS} label="Copy Import Steps" icon="📝" />
                        </div>
                        <div className="rounded-xl bg-zinc-900 p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
                            <pre className="text-xs text-zinc-100 leading-5 font-mono whitespace-pre">{jsonPretty}</pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Curl & Mermaid tab */}
            {activeTab === "curl" && (
                <div className="space-y-4">
                    {curlBlocks.length > 0 && (
                        <div className="rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm overflow-hidden">
                            <div className="p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-[color:var(--fg)] flex items-center gap-2">🧪 Curl Samples</h4>
                                {curlBlocks.map((curl, idx) => (
                                    <div key={`curl-${idx}`} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[color:var(--fg-muted)]">Sample #{idx + 1}</span>
                                            <CopyButton text={curl} label="Copy curl" />
                                        </div>
                                        <pre className="rounded-xl bg-zinc-900 p-3 text-xs text-emerald-300 overflow-x-auto leading-5">{curl}</pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {mermaidBlocks.length > 0 && (
                        <div className="rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm overflow-hidden">
                            <div className="p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-[color:var(--fg)] flex items-center gap-2">📊 Mermaid Diagrams</h4>
                                {mermaidBlocks.map((mermaid, idx) => (
                                    <div key={`mermaid-${idx}`} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-[color:var(--fg-muted)]">Diagram #{idx + 1}</span>
                                            <CopyButton text={mermaid} label="Copy Mermaid" />
                                        </div>
                                        <pre className="rounded-xl bg-zinc-900 p-3 text-xs text-sky-300 overflow-x-auto leading-5">{mermaid}</pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Main Component ── */

export default function N8nIntegrationClient() {
    const router = useRouter();
    const [checkingRole, setCheckingRole] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<WorkflowDetail | null>(null);
    const [listLoading, setListLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQ, setSearchQ] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("");

    const handleAuthError = useCallback(
        (err: ApiClientError) => {
            if (err.code === "AUTH_MISSING_BEARER" || err.code === "AUTH_INVALID_TOKEN") {
                clearToken();
                router.replace("/login");
                return true;
            }
            return false;
        },
        [router]
    );

    // Check role
    useEffect(() => {
        fetchMe()
            .then((data) => setIsAdmin(isAdminRole(data.user.role)))
            .catch(() => {
                clearToken();
                router.replace("/login");
            })
            .finally(() => setCheckingRole(false));
    }, [router]);

    // Load workflow list
    const loadList = useCallback(async () => {
        const token = getToken();
        if (!token || !isAdmin) return;
        setListLoading(true);
        setError("");
        try {
            const data = await fetchJson<{ ok: true; workflows: WorkflowListItem[] }>("/api/admin/n8n/workflows", { token });
            setWorkflows(data.workflows);
        } catch (e) {
            const err = e as ApiClientError;
            if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`);
        } finally {
            setListLoading(false);
        }
    }, [handleAuthError, isAdmin]);

    useEffect(() => {
        if (isAdmin) void loadList();
    }, [isAdmin, loadList]);

    // Load workflow detail
    const loadDetail = useCallback(
        async (id: string) => {
            const token = getToken();
            if (!token) return;
            setDetailLoading(true);
            try {
                const data = await fetchJson<WorkflowDetail & { ok: true }>(`/api/admin/n8n/workflows/${id}`, { token });
                setDetail(data);
            } catch (e) {
                const err = e as ApiClientError;
                if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`);
            } finally {
                setDetailLoading(false);
            }
        },
        [handleAuthError]
    );

    const handleSelect = useCallback(
        (id: string | null) => {
            setSelectedId(id);
            setDetail(null);
            if (id) void loadDetail(id);
        },
        [loadDetail]
    );

    // Filter workflows
    const filteredWorkflows = useMemo(() => {
        const q = searchQ.trim().toLowerCase();
        return workflows.filter((w) => {
            if (typeFilter && w.type !== typeFilter) return false;
            if (!q) return true;
            return w.id.toLowerCase().includes(q) || w.title.toLowerCase().includes(q);
        });
    }, [workflows, searchQ, typeFilter]);

    const subWorkflows = useMemo(() => filteredWorkflows.filter((w) => w.type === "sub-workflow"), [filteredWorkflows]);
    const mainWorkflows = useMemo(() => filteredWorkflows.filter((w) => w.type !== "sub-workflow"), [filteredWorkflows]);

    if (checkingRole) {
        return (
            <div className="flex items-center gap-2 text-[color:var(--fg)] py-20 justify-center">
                <Spinner /> Đang kiểm tra quyền...
            </div>
        );
    }

    if (!isAdmin) {
        return <Alert type="error" message="Bạn không có quyền truy cập trang này." />;
    }

    return (
        <div className="space-y-4">
            {/* Premium Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-4 text-white shadow-lg shadow-sky-200 animate-fade-in-up">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />
                <div className="relative flex flex-wrap items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">🔗</div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold">Đấu nối N8N</h2>
                        <p className="text-sm text-white/80">Tài liệu, JSON workflow, curl samples — import vào N8N là chạy ngay</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge text={`${workflows.length} workflows`} tone="accent" />
                    </div>
                </div>
            </div>

            {error ? <Alert type="error" message={error} /> : null}

            {/* 2-column layout */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {/* Left: Sidebar */}
                <aside className="w-full lg:w-80 lg:min-w-[320px] shrink-0 space-y-3">
                    {/* Search + Filter */}
                    <div className="rounded-2xl border border-[var(--border-hairline)] bg-white shadow-sm overflow-hidden">
                        <div className="p-3 space-y-2">
                            <input
                                type="text"
                                placeholder="Tìm workflow..."
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                                className="h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                            />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-blue-400"
                            >
                                <option value="">Tất cả loại</option>
                                <option value="sub-workflow">Sub-workflow</option>
                                <option value="cron">Cron</option>
                                <option value="webhook">Webhook</option>
                                <option value="interval">Interval</option>
                            </select>
                        </div>
                    </div>

                    {/* Overview button */}
                    <button
                        type="button"
                        onClick={() => handleSelect(null)}
                        className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${selectedId === null
                            ? "border-blue-300 bg-blue-50 text-blue-800 shadow-sm"
                            : "border-[var(--border-hairline)] bg-white text-[color:var(--fg)] hover:bg-[var(--bg-elevated)]"
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-lg">📋</span>
                            <span className="font-semibold">Tổng quan & Setup</span>
                        </span>
                        <span className="text-xs text-[color:var(--fg-muted)] block mt-0.5">Env vars, thứ tự import, endpoint groups</span>
                    </button>

                    {listLoading ? (
                        <div className="flex items-center gap-2 text-sm text-[color:var(--fg-muted)] py-4 justify-center">
                            <Spinner /> Đang tải...
                        </div>
                    ) : (
                        <>
                            {/* Sub-workflows */}
                            {subWorkflows.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--fg-muted)] px-1">Sub-workflows</p>
                                    {subWorkflows.map((w) => (
                                        <WorkflowListButton key={w.id} item={w} selected={selectedId === w.id} onSelect={handleSelect} />
                                    ))}
                                </div>
                            )}

                            {/* Main workflows */}
                            {mainWorkflows.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--fg-muted)] px-1">Workflows chính</p>
                                    {mainWorkflows.map((w) => (
                                        <WorkflowListButton key={w.id} item={w} selected={selectedId === w.id} onSelect={handleSelect} />
                                    ))}
                                </div>
                            )}

                            {filteredWorkflows.length === 0 && !listLoading && (
                                <p className="text-center text-sm text-[color:var(--fg-muted)] py-4">Không tìm thấy workflow</p>
                            )}
                        </>
                    )}
                </aside>

                {/* Right: Detail */}
                <div className="flex-1 min-w-0">
                    {selectedId === null ? <OverviewPanel /> : <WorkflowDetailPanel detail={detail} loading={detailLoading} />}
                </div>
            </div>
        </div>
    );
}

/* ── Sidebar item button ── */

function WorkflowListButton({
    item,
    selected,
    onSelect,
}: {
    item: WorkflowListItem;
    selected: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full rounded-xl border p-2.5 text-left transition-all group ${selected
                ? "border-blue-300 bg-blue-50 shadow-sm"
                : "border-[var(--border-hairline)] bg-white hover:bg-[var(--bg-elevated)] hover:border-[var(--border-subtle)]"
                }`}
        >
            <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[item.type]}`}>
                    {TYPE_LABELS[item.type]}
                </span>
                <span className="text-xs font-semibold text-[color:var(--fg)] truncate flex-1">{item.id}</span>
            </div>
            <p className="text-[11px] text-[color:var(--fg-muted)] truncate mt-0.5">{item.title}</p>
            <div className="flex gap-1 mt-1">
                {item.docFilename && <span className="text-[9px] bg-[var(--bg-inset)] text-[color:var(--fg-muted)] px-1.5 py-0.5 rounded-full">📖 doc</span>}
                {item.jsonFilename && <span className="text-[9px] bg-[var(--bg-inset)] text-[color:var(--fg-muted)] px-1.5 py-0.5 rounded-full">📦 json</span>}
            </div>
        </button>
    );
}
