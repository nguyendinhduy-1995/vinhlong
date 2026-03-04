"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { fetchMe, type MeResponse } from "@/lib/auth-client";
import { hasUiPermission } from "@/lib/ui-permissions";
import type { ModuleKey } from "@/lib/permission-keys";

/* ── Tabs ── */
type Tab = "van-hanh" | "ai" | "runbook";
const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "van-hanh", label: "Vận hành", icon: "📖" },
    { key: "ai", label: "Trợ lý AI", icon: "🤖" },
    { key: "runbook", label: "Runbook", icon: "📋" },
];

/* ── Runbook parsing (reused from AdminGuideClient) ── */
type GuideSection = { id: string; title: string; content: string; moduleKey: ModuleKey | null };

const TITLE_TO_MODULE: Array<{ includes: string; module: ModuleKey }> = [
    { includes: "tổng quan", module: "overview" },
    { includes: "khách hàng", module: "leads" },
    { includes: "kpi", module: "kpi_daily" },
    { includes: "mục tiêu kpi", module: "kpi_targets" },
    { includes: "mục tiêu ngày", module: "goals" },
    { includes: "trợ lý công việc", module: "ai_kpi_coach" },
    { includes: "thu tiền", module: "receipts" },
    { includes: "lương", module: "hr_total_payroll" },
    { includes: "học viên", module: "students" },
    { includes: "khóa học", module: "courses" },
    { includes: "lịch học", module: "schedule" },
    { includes: "tự động hóa", module: "automation_run" },
    { includes: "outbound", module: "messaging" },
    { includes: "chi phí", module: "expenses" },
    { includes: "api hub", module: "api_hub" },
    { includes: "người dùng", module: "admin_users" },
    { includes: "chi nhánh", module: "admin_branches" },
    { includes: "học phí", module: "admin_tuition" },
];

function toSectionId(input: string) {
    return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function sectionModule(title: string): ModuleKey | null {
    const lower = title.toLowerCase();
    return TITLE_TO_MODULE.find((item) => lower.includes(item.includes))?.module ?? null;
}

function parseSections(markdown: string): GuideSection[] {
    const parts = markdown.split(/^##\s+/gm).filter(Boolean);
    return parts.map((part, index) => {
        const lines = part.split("\n");
        const title = (lines.shift() || `Mục ${index + 1}`).trim();
        const content = lines.join("\n").trim();
        return { id: toSectionId(title) || `muc-${index + 1}`, title, content, moduleKey: sectionModule(title) };
    });
}

/* ── Main Component ── */
export function UnifiedGuideClient({ runbookMarkdown }: { runbookMarkdown: string }) {
    const [tab, setTab] = useState<Tab>("van-hanh");
    const [user, setUser] = useState<MeResponse["user"] | null>(null);
    const [query, setQuery] = useState("");
    const guardRef = useRef(false);

    useEffect(() => {
        if (guardRef.current) return;
        guardRef.current = true;
        fetchMe().then((res) => setUser(res.user)).catch(() => setUser(null));
    }, []);

    const sections = useMemo(() => parseSections(runbookMarkdown), [runbookMarkdown]);
    const filteredSections = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return sections;
        return sections.filter((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
    }, [sections, query]);

    return (
        <div className="space-y-4">
            {/* ── Header ── */}
            <div className="glass-2 rounded-2xl p-5 animate-fade-in-up">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: 'var(--accent-bg)' }}>📚</div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Hướng dẫn</h2>
                        <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Tài liệu vận hành, trợ lý AI và runbook hệ thống</p>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1.5 rounded-2xl glass-2 p-1.5">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${tab === t.key
                                ? "glass-3 shadow-sm text-[color:var(--accent)]"
                                : "text-[color:var(--fg-muted)] hover:bg-[var(--hover)]"
                            }`}
                    >
                        <span className="mr-1.5">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Tab: Vận hành ── */}
            {tab === "van-hanh" && (
                <div className="space-y-3 animate-fade-in-up">
                    <Card title="1) Mục tiêu" gradient="from-sky-500 to-teal-500">
                        <p>Giữ luồng xử lý đều mỗi ngày: không rơi khách, không trễ nhắc việc, và giữ tỉ lệ KPI phần trăm theo mục tiêu đã đặt.</p>
                    </Card>
                    <Card title="2) Ai dùng" gradient="from-sky-500 to-teal-500">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Trực Page: theo dõi tỉ lệ lấy được số và xử lý data chưa có số.</li>
                            <li>Tư vấn: theo dõi hẹn/đến/ký theo phần trăm và danh sách gọi nhắc.</li>
                            <li>Quản lý: theo dõi tổng quan chi nhánh và phân việc ưu tiên.</li>
                            <li>Quản trị: kiểm soát quyền, luồng tự động, nhật ký và cấu hình tích hợp.</li>
                        </ul>
                    </Card>
                    <Card title="3) Dữ liệu vào" gradient="from-sky-500 to-teal-500">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Khách hàng và lịch sử tương tác từ CRM.</li>
                            <li>KPI phần trăm theo ngày/tháng từ màn hình KPI.</li>
                            <li>Việc cần làm và nhật ký tự động hóa do hệ thống ghi lại.</li>
                            <li>Dữ liệu tự động từ n8n gửi về qua API ingest.</li>
                        </ul>
                    </Card>
                    <Card title="4) Thao tác theo ca" gradient="from-sky-500 to-teal-500">
                        <ol className="list-decimal space-y-1 pl-5">
                            <li>Vào KPI ngày để xem tỉ lệ phần trăm hiện tại.</li>
                            <li>Vào Trợ lý công việc để xem gợi ý ưu tiên.</li>
                            <li>Bấm tạo gọi nhắc hoặc tạo việc cần làm để giao cho đúng người.</li>
                            <li>Cuối ca kiểm tra nhật ký tự động để xử lý lỗi còn tồn.</li>
                            <li>Phản hồi Đúng, hữu ích hoặc Chưa đúng để hệ thống học dần.</li>
                        </ol>
                    </Card>
                    <Card title="5) Lỗi thường gặp" gradient="from-sky-500 to-teal-500">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Không thấy dữ liệu: kiểm tra quyền tài khoản theo chi nhánh/phụ trách.</li>
                            <li>Không tạo được gọi nhắc: kiểm tra quyền thao tác gửi tin và thông tin liên hệ.</li>
                            <li>Không có gợi ý mới: kiểm tra luồng tự động n8n và token tích hợp.</li>
                        </ul>
                    </Card>
                    <Card title="6) Cách kiểm tra nhanh" gradient="from-sky-500 to-teal-500">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                Màn hình:{" "}
                                <Link className="text-[color:var(--accent)] hover:underline" href="/kpi/daily">/kpi/daily</Link>,{" "}
                                <Link className="text-[color:var(--accent)] hover:underline" href="/ai/kpi-coach">/ai/kpi-coach</Link>,{" "}
                                <Link className="text-[color:var(--accent)] hover:underline" href="/automation/logs">/automation/logs</Link>,{" "}
                                <Link className="text-[color:var(--accent)] hover:underline" href="/api-hub">/api-hub</Link>.
                            </li>
                            <li>
                                API quan trọng: <code>/api/kpi/daily</code>, <code>/api/ai/suggestions</code>, <code>/api/tasks</code>, <code>/api/automation/logs</code>, <code>/api/admin/n8n/workflows</code>.
                            </li>
                        </ul>
                    </Card>
                </div>
            )}

            {/* ── Tab: AI Guide ── */}
            {tab === "ai" && (
                <div className="space-y-3 animate-fade-in-up">
                    <Card title="📊 1) Đọc KPI phần trăm như thế nào?" gradient="from-fuchsia-500 to-pink-500">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Trực Page: xem tỉ lệ lấy được số trong ngày.</li>
                            <li>Tư vấn: xem 3 tỉ lệ chính là hẹn từ data, đến từ hẹn, ký từ đến.</li>
                            <li>Nếu tỉ lệ thấp hơn mục tiêu, ưu tiên xử lý ngay trong ca làm.</li>
                        </ul>
                    </Card>
                    <Card title="📋 2) Dùng Trợ lý công việc hằng ngày" gradient="from-pink-500 to-rose-500">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Mở trang Trợ lý công việc và chọn đúng ngày cần xem.</li>
                            <li>Đọc từng gợi ý theo màu: Đỏ cần làm ngay, Vàng cần theo dõi, Xanh đang ổn.</li>
                            <li>Bấm &quot;Tạo danh sách gọi&quot; để đẩy việc ra hàng gọi nhanh.</li>
                        </ul>
                    </Card>
                    <Card title="💬 3) Phản hồi để hệ thống ngày càng đúng" gradient="from-rose-500 to-red-500">
                        <ul className="list-disc space-y-1 pl-5">
                            <li>Nếu gợi ý đúng: bấm &quot;Đúng, hữu ích&quot;.</li>
                            <li>Nếu chưa đúng: bấm &quot;Chưa đúng&quot; và ghi chú ngắn lý do.</li>
                            <li>Phản hồi càng đều thì gợi ý sau càng sát thực tế vận hành.</li>
                        </ul>
                    </Card>
                    <Card title="⚙️ 4) n8n chạy ra sao?" gradient="from-purple-500 to-fuchsia-500">
                        <p>n8n là nơi xử lý tự động: lấy dữ liệu từ CRM, phân tích và gửi gợi ý về lại hệ thống. CRM chỉ làm 3 việc chính: cung cấp API dữ liệu, hiển thị gợi ý và lưu phản hồi.</p>
                    </Card>
                </div>
            )}

            {/* ── Tab: Runbook ── */}
            {tab === "runbook" && (
                <div className="space-y-3 animate-fade-in-up">
                    {runbookMarkdown ? (
                        <>
                            <div className="glass-2 rounded-2xl p-4">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Tìm trong runbook..."
                                    className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 text-sm text-[color:var(--fg)] outline-none transition focus:border-[var(--border-focus)]"
                                />
                            </div>
                            {filteredSections.length === 0 ? (
                                <div className="glass-2 rounded-2xl p-8 text-center text-sm text-[color:var(--fg-muted)]">
                                    Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
                                </div>
                            ) : (
                                filteredSections.map((section) => {
                                    const hasPerm = section.moduleKey ? hasUiPermission(user?.permissions, section.moduleKey, "VIEW") : true;
                                    return (
                                        <details key={section.id} id={section.id} className="group glass-2 rounded-2xl overflow-hidden transition open:ring-1 open:ring-[var(--border-subtle)]">
                                            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-[color:var(--fg)]">{section.title}</p>
                                                    <p className="text-[11px] text-[color:var(--fg-muted)]">{section.moduleKey ? `Module: ${section.moduleKey}` : "Tài liệu chung"}</p>
                                                </div>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${hasPerm ? "bg-[var(--success-bg)] text-[color:var(--success-fg)]" : "bg-[var(--warning-bg)] text-[color:var(--warning-fg)]"}`}>
                                                    {hasPerm ? "Có quyền" : "Không quyền"}
                                                </span>
                                            </summary>
                                            <div className="border-t border-[var(--border-hairline)] px-4 py-3">
                                                <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--fg)]">{section.content}</pre>
                                            </div>
                                        </details>
                                    );
                                })
                            )}
                        </>
                    ) : (
                        <div className="glass-2 rounded-2xl p-8 text-center">
                            <p className="text-sm text-[color:var(--fg-muted)]">Chưa có tài liệu FEATURE_MAP_AND_RUNBOOK.md</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Reusable Card for guide sections ── */
function Card({ title, gradient, children }: { title: string; gradient: string; children: React.ReactNode }) {
    return (
        <div className="overflow-hidden glass-2 rounded-2xl">
            <div className={`h-1 bg-gradient-to-r ${gradient}`} />
            <div className="p-4">
                <h3 className="text-sm font-semibold text-[color:var(--fg)]">{title}</h3>
                <div className="mt-2 text-sm text-[color:var(--fg)]">{children}</div>
            </div>
        </div>
    );
}
