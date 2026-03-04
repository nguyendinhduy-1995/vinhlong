"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, getToken } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table } from "@/components/ui/table";

type InstructorItem = {
    id: string;
    name: string;
    phone: string | null;
    status: string;
    studentCount: number;
    lessonCount: number;
    createdAt: string;
};

type InstructorsRes = { items: InstructorItem[]; page: number; pageSize: number; total: number };

function statusBadge(status: string) {
    return status === "ACTIVE" ? <Badge text="Hoạt động" tone="success" /> : <Badge text="Ngừng" tone="neutral" />;
}

export default function InstructorsPage() {
    const router = useRouter();
    const [data, setData] = useState<InstructorsRes | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [qInput, setQInput] = useState("");
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 20;

    /* debounce search input */
    useEffect(() => {
        const timer = setTimeout(() => {
            setQ(qInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [qInput]);

    const load = useCallback(async () => {
        const token = getToken();
        if (!token) { router.replace("/login"); return; }
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (q.trim()) params.set("q", q.trim());
            const res = await fetchJson<InstructorsRes>(`/api/instructors?${params}`, { token });
            setData(res);
        } catch (e) {
            const err = e as ApiClientError;
            if (err.code === "AUTH_MISSING_BEARER" || err.code === "AUTH_INVALID_TOKEN") { clearToken(); router.replace("/login"); return; }
            setError(err.message || "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, [page, q, router]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-4">
            {/* ── Premium Header ── */}
            <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">                <div className="relative flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">🚗</div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Giáo viên thực hành</h2>
                        <p className="text-sm text-[color:var(--fg-muted)]">{data?.total ?? 0} giáo viên</p>
                    </div>
                    <Link href="/admin/instructors/new">
                        <Button >+ Thêm giáo viên</Button>
                    </Link>
                </div>
            </div>

            {error ? <Alert type="error" message={error} /> : null}

            <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>                <div className="p-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <Input placeholder="Tìm tên GV..." value={qInput} onChange={(e) => setQInput(e.target.value)} />
                        <Button variant="secondary" onClick={load}>Tìm</Button>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                {loading ? (
                    <div className="animate-pulse space-y-2 p-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--bg-elevated)] p-3">
                                <div className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)]" />
                                <div className="flex-1 space-y-2"><div className="h-4 w-1/3 rounded bg-[var(--bg-elevated)]" /><div className="h-3 w-1/4 rounded bg-[var(--bg-inset)]" /></div>
                                <div className="h-6 w-16 rounded-full bg-[var(--bg-elevated)]" />
                            </div>
                        ))}
                    </div>
                ) : !data?.items.length ? (
                    <div className="p-6 text-center text-sm text-[color:var(--fg-muted)]">Không có dữ liệu</div>
                ) : (
                    <>
                        <Table headers={["Tên", "SĐT", "Trạng thái", "Số HV", "Số buổi", "Hành động"]}>
                            {data.items.map((item, idx) => (
                                <tr key={item.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 30, 200)}ms` }}>
                                    <td className="px-3 py-2 font-medium text-[color:var(--fg)]">{item.name}</td>
                                    <td className="px-3 py-2 text-[color:var(--fg)]">{item.phone || "-"}</td>
                                    <td className="px-3 py-2">{statusBadge(item.status)}</td>
                                    <td className="px-3 py-2 text-[color:var(--fg)]">{item.studentCount}</td>
                                    <td className="px-3 py-2 text-[color:var(--fg)]">{item.lessonCount}</td>
                                    <td className="px-3 py-2">
                                        <Link href={`/admin/instructors/${item.id}`} className="text-sm font-medium text-[color:var(--accent)] hover:underline">
                                            Chi tiết
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                        <div className="p-3">
                            <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
