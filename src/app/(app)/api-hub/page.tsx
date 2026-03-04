"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_CATALOG, type ApiCatalogItem } from "@/lib/api-catalog";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchMe } from "@/lib/auth-client";
import { hasUiPermission } from "@/lib/ui-permissions";
import { fetchJson, type ApiClientError } from "@/lib/api-client";

const MODULE_ORDER = [
  "Tổng quan",
  "Khách hàng",
  "Bảng trạng thái",
  "KPI ngày",
  "Mục tiêu KPI",
  "Mục tiêu ngày/tháng",
  "Trợ lý công việc",
  "Học viên",
  "Khóa học",
  "Lịch học",
  "Thu tiền",
  "Thông báo",
  "Gửi tin",
  "Lương tôi",
  "AI hỗ trợ nhân sự",
  "Luồng n8n",
  "Tự động hóa - Nhật ký",
  "Tự động hóa - Chạy tay",
  "Báo cáo Meta Ads",
  "Chi nhánh",
  "Người dùng",
  "Phân khách hàng",
  "Bảng học phí",
  "Quản trị thông báo",
  "Vận hành tự động",
  "Tiến trình gửi tin",
  "Lập lịch",
  "Nội dung học viên",
  "KPI nhân sự",
  "Hồ sơ lương",
  "Chấm công",
  "Tổng lương",
] as const;

function methodClass(method: ApiCatalogItem["method"]) {
  if (method === "GET") return "bg-[var(--success-bg)] text-[color:var(--success-fg)] border-[var(--border-subtle)]";
  if (method === "POST") return "bg-[var(--accent-bg)] text-[color:var(--accent)] border-[var(--border-subtle)]";
  if (method === "PATCH") return "bg-[var(--warning-bg)] text-[color:var(--warning-fg)] border-[var(--border-subtle)]";
  if (method === "PUT") return "bg-violet-50 text-violet-700 border-violet-200";
  return "bg-[var(--danger-bg)] text-[color:var(--danger)] border-[var(--border-subtle)]";
}

export default function ApiHubPage() {
  const router = useRouter();
  const guardStartedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"api" | "n8n">("api");
  const [workflows, setWorkflows] = useState<Array<{
    id: string;
    name: string;
    objective: string;
    trigger: string;
    schedule: string;
    apiCalls: Array<{ method: string; endpoint: string; headers: string[] }>;
    samplePayload: string;
    retryBackoff: string;
    idempotency: string;
    definitionOfDone?: string[];
    failConditions?: string[];
    retryPolicy?: string[];
    n8nNotes?: string[];
  }>>([]);

  const loadPermission = useCallback(async () => {
    setLoading(true);
    setError("");
    setUnauthorized(false);
    setForbidden(false);
    try {
      const me = await Promise.race([
        fetchMe(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 10000)),
      ]);
      const canView = hasUiPermission(me.user.permissions, "api_hub", "VIEW");
      setForbidden(!canView);
    } catch (e) {
      const err = e as ApiClientError;
      if (err?.status === 401 || err?.code?.startsWith("AUTH_")) {
        setUnauthorized(true);
        router.replace("/login");
        return;
      }
      if (err?.status === 403 || err?.code === "AUTH_FORBIDDEN") {
        setForbidden(true);
        return;
      }
      setError("Không thể kiểm tra quyền truy cập. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (guardStartedRef.current) return;
    guardStartedRef.current = true;
    void loadPermission();
  }, [loadPermission]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return API_CATALOG;
    return API_CATALOG.filter((item) => {
      const haystack = [
        item.module,
        item.name,
        item.method,
        item.path,
        item.description,
        item.auth,
        ...(item.params || []),
        ...(item.body || []),
        ...(item.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, ApiCatalogItem[]>();
    for (const item of filtered) {
      const rows = map.get(item.module) || [];
      rows.push(item);
      map.set(item.module, rows);
    }
    return MODULE_ORDER.map((module) => ({ module, items: map.get(module) || [] })).filter((g) => g.items.length > 0);
  }, [filtered]);

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1200);
  }

  const loadN8nWorkflows = useCallback(async () => {
    try {
      const data = await fetchJson<{
        workflows: Array<{
          id: string;
          name: string;
          objective: string;
          trigger: string;
          schedule: string;
          apiCalls: Array<{ method: string; endpoint: string; headers: string[] }>;
          samplePayload: string;
          retryBackoff: string;
          idempotency: string;
          definitionOfDone?: string[];
          failConditions?: string[];
          retryPolicy?: string[];
          n8nNotes?: string[];
        }>;
      }>("/api/admin/n8n/workflows");
      setWorkflows(Array.isArray(data.workflows) ? data.workflows : []);
    } catch {
      setWorkflows([]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "n8n") {
      void loadN8nWorkflows();
    }
  }, [activeTab, loadN8nWorkflows]);

  if (loading) {
    return (
      <div className="glass-2 rounded-2xl p-6 text-sm text-[color:var(--fg-secondary)]">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Alert type="error" message={error} />
        <Button variant="secondary" onClick={() => void loadPermission()}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (forbidden) {
    return <Alert type="error" message="Bạn không có quyền truy cập" />;
  }

  if (unauthorized) {
    return <Alert type="error" message="Phiên đăng nhập không hợp lệ. Đang chuyển đến trang đăng nhập..." />;
  }

  return (
    <div className="space-y-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">🔌</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>API Hub</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Tra cứu nhanh API để tích hợp hệ thống bên ngoài.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-sm font-bold backdrop-blur-sm">📊 {filtered.length} API</span>
        </div>
      </div>

      <Alert type="info" message="Không dán token thật vào tài liệu hoặc ảnh chụp màn hình. Mọi ví dụ bên dưới dùng token REDACTED." />

      <section className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>        <div className="p-4">
          <h2 className="text-base font-semibold text-[color:var(--fg)] flex items-center gap-2">🔧 Tích hợp</h2>
          <div className="mt-2 space-y-1 text-sm text-[color:var(--fg)]">
            <p><span className="font-medium text-[color:var(--fg)]">Base URL:</span> `http://localhost:3000` (local), staging/prod dùng placeholder trong spec.</p>
            <p><span className="font-medium text-[color:var(--fg)]">Auth:</span> `POST /api/auth/login` lấy token Bearer, sau đó làm mới qua `POST /api/auth/refresh`.</p>
            <p><span className="font-medium text-[color:var(--fg)]">Idempotency:</span> gửi `Idempotency-Key` cho các API tạo mới như phiếu thu, danh sách gọi nhắc, gửi đi hàng đợi gọi nhắc, lịch học, nạp dữ liệu AI.</p>
            <p><span className="font-medium text-[color:var(--fg)]">Webhook:</span> callback outbound tại `POST /api/outbound/callback`, header hiện dùng `x-callback-secret` (có placeholder `x-signature` trong spec).</p>
          </div>
          <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs text-[color:var(--fg-secondary)]">
            <p className="font-semibold uppercase tracking-wide text-[color:var(--fg-muted)]">Tài liệu repo</p>
            <p className="mt-1 font-mono">PERMISSION_MATRIX.md</p>
            <p className="font-mono">API_INTEGRATION_SPEC.md</p>
            <p className="mt-2 text-[11px] text-[color:var(--fg-muted)]">Luồng mới: tạo việc từ đề xuất, tạo danh sách gọi từ đề xuất, nhắc đánh giá khi việc hoàn thành.</p>
          </div>
        </div>
      </section>

      <div className="overflow-hidden glass-2 rounded-2xl p-3 shadow-sm animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <div className="mb-3 inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1">
          <button type="button" onClick={() => setActiveTab("api")} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${activeTab === "api" ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow" : "text-[color:var(--fg-secondary)] hover:text-[color:var(--fg)]"}`}>📡 API tích hợp</button>
          <button type="button" onClick={() => setActiveTab("n8n")} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${activeTab === "n8n" ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow" : "text-[color:var(--fg-secondary)] hover:text-[color:var(--fg)]"}`}>⚙️ Luồng tự động (n8n)</button>
        </div>
        {activeTab === "api" ? <Input placeholder="🔍 Tìm API..." value={query} onChange={(e) => setQuery(e.target.value)} /> : null}
      </div>

      {activeTab === "api" && grouped.length === 0 ? (
        <div className="glass-2 rounded-2xl p-8 text-center animate-fade-in-up">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-inset)] text-2xl">🔍</div>
          <p className="font-medium text-[color:var(--fg)]">Không tìm thấy API phù hợp.</p>
        </div>
      ) : null}

      {activeTab === "api" ? (
        grouped.map((group) => (
          <section key={group.module} className="space-y-2">
            <h2 className="text-base font-semibold text-[color:var(--fg)]">{group.module}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {group.items.map((api) => (
                <article key={api.id} className="glass-2 rounded-2xl p-4 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${methodClass(api.method)}`}>
                      {api.method}
                    </span>
                    <h3 className="text-sm font-semibold text-[color:var(--fg)]">{api.name}</h3>
                  </div>

                  <p className="font-mono text-xs text-[color:var(--fg)]">{api.path}</p>
                  <p className="mt-1 text-sm text-[color:var(--fg-secondary)]">{api.description}</p>
                  <p className="mt-1 text-xs text-[color:var(--fg-muted)]">Xác thực: {api.auth}</p>

                  {api.params && api.params.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--fg-muted)]">Params</p>
                      <pre className="mt-1 overflow-auto rounded-xl bg-[var(--bg-elevated)] p-2 text-xs text-[color:var(--fg)]">{api.params.join("\n")}</pre>
                    </div>
                  ) : null}

                  {api.body && api.body.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--fg-muted)]">Body Schema</p>
                      <pre className="mt-1 overflow-auto rounded-xl bg-[var(--bg-elevated)] p-2 text-xs text-[color:var(--fg)]">{api.body.join("\n")}</pre>
                    </div>
                  ) : null}

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--fg-muted)]">Response mẫu</p>
                      <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => copyText(`${api.id}-res`, api.response)}>
                        {copiedId === `${api.id}-res` ? "Đã sao chép" : "Sao chép"}
                      </Button>
                    </div>
                    <pre className="overflow-auto rounded-xl bg-[var(--bg-elevated)] p-2 text-xs text-[color:var(--fg)]">{api.response}</pre>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--fg-muted)]">Ví dụ curl</p>
                      <Button variant="secondary" className="h-8 px-2 text-xs" onClick={() => copyText(`${api.id}-curl`, api.curl)}>
                        {copiedId === `${api.id}-curl` ? "Đã sao chép" : "Sao chép"}
                      </Button>
                    </div>
                    <pre className="overflow-auto rounded-xl bg-[var(--bg-elevated)] p-2 text-xs text-[color:var(--fg)]">{api.curl}</pre>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : null}

      {activeTab === "n8n" ? (
        <div className="space-y-3">
          <section className="glass-2 rounded-2xl p-4 shadow-sm">
            <h2 className="text-base font-semibold text-[color:var(--fg)]">Cách đấu nối nhanh</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[color:var(--fg)]">
              <li>Dùng node HTTP Request trong n8n để gọi endpoint ingest.</li>
              <li>Gửi header <code>x-service-token: REDACTED</code> và <code>Idempotency-Key: REDACTED-UUID</code>.</li>
              <li>Bật retry 3 lần với giãn cách tăng dần để tránh mất dữ liệu.</li>
              <li>Không dán token thật vào màn hình hoặc tài liệu chia sẻ.</li>
              <li>n8n có thể đọc phản hồi người dùng để chấm lại độ phù hợp của từng gợi ý.</li>
            </ul>
          </section>

          {workflows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 text-sm text-[color:var(--fg-secondary)]">
              Chưa có dữ liệu luồng tự động.
            </div>
          ) : (
            workflows.map((wf) => (
              <article key={wf.id} className="glass-2 rounded-2xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-[color:var(--fg)]">{wf.name}</h3>
                <div className="mt-2 grid gap-2 text-sm text-[color:var(--fg)] md:grid-cols-2">
                  <p><span className="font-medium text-[color:var(--fg)]">Mục tiêu:</span> {wf.objective}</p>
                  <p><span className="font-medium text-[color:var(--fg)]">Kích hoạt:</span> {wf.trigger} - {wf.schedule}</p>
                  <p><span className="font-medium text-[color:var(--fg)]">Retry/backoff:</span> {wf.retryBackoff}</p>
                  <p><span className="font-medium text-[color:var(--fg)]">Idempotency:</span> {wf.idempotency}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--fg-muted)]">Điểm vào/ra API</p>
                  <div className="mt-1 space-y-2 text-sm text-[color:var(--fg)]">
                    {wf.apiCalls.map((call, idx) => (
                      <div key={`${wf.id}-${idx}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <p><code>{call.method} {call.endpoint}</code></p>
                        <p className="text-xs text-[color:var(--fg-secondary)]">Headers mẫu: {call.headers.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--fg-muted)]">Payload mẫu</p>
                    <Button
                      variant="secondary"
                      className="h-8 px-2 text-xs"
                      onClick={() => copyText(`${wf.id}-sample`, wf.samplePayload)}
                    >
                      {copiedId === `${wf.id}-sample` ? "Đã sao chép" : "Sao chép"}
                    </Button>
                  </div>
                  <pre className="overflow-auto rounded-xl bg-[var(--bg-elevated)] p-2 text-xs text-[color:var(--fg)]">{wf.samplePayload}</pre>
                </div>
                {Array.isArray(wf.n8nNotes) && wf.n8nNotes.length > 0 ? (
                  <details className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--accent-bg)]/70 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-sky-800">Ghi chú n8n</summary>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-sky-900">
                      {wf.n8nNotes.map((note, idx) => (
                        <li key={`${wf.id}-note-${idx}`}>{note}</li>
                      ))}
                    </ol>
                  </details>
                ) : null}
                {Array.isArray(wf.definitionOfDone) && wf.definitionOfDone.length > 0 ? (
                  <details className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--success-bg)]/70 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-emerald-800">Điều kiện hoàn tất</summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-900">
                      {wf.definitionOfDone.map((item, idx) => (
                        <li key={`${wf.id}-dod-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                {Array.isArray(wf.failConditions) && wf.failConditions.length > 0 ? (
                  <details className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--danger-bg)]/70 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-[color:var(--danger-fg)]">Điều kiện lỗi</summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[color:var(--danger-fg)]">
                      {wf.failConditions.map((item, idx) => (
                        <li key={`${wf.id}-fail-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                {Array.isArray(wf.retryPolicy) && wf.retryPolicy.length > 0 ? (
                  <details className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--warning-bg)]/70 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-[color:var(--warning-fg)]">Chính sách thử lại</summary>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                      {wf.retryPolicy.map((item, idx) => (
                        <li key={`${wf.id}-retry-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </article>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
