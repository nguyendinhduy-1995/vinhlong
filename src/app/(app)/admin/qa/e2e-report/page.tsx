"use client";

import { useEffect, useState } from "react";

interface TestCase {
    name: string;
    status: string;
    duration: number;
    file: string;
}

interface Snapshot {
    name: string;
    size: number;
    modified: string;
}

interface E2EReport {
    lastRun: string;
    summary: { total: number; passed: number; failed: number; skipped: number };
    htmlReportAvailable: boolean;
    testCases: TestCase[];
    snapshots: Snapshot[];
}

export default function E2EReportPage() {
    const [report, setReport] = useState<E2EReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/qa/e2e-results")
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => setReport(data))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-6 text-[color:var(--fg-muted)]">Đang tải kết quả E2E...</div>;
    if (error) return <div className="p-6 text-[color:var(--danger)]">Lỗi: {error}</div>;
    if (!report) return <div className="p-6 text-[color:var(--fg-muted)]">Không có dữ liệu</div>;

    const { summary, testCases, snapshots, lastRun, htmlReportAvailable } = report;
    const passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">📊 E2E Test Report</h1>
                <span className="text-sm text-[color:var(--fg-muted)]">
                    Lần chạy cuối: {new Date(lastRun).toLocaleString("vi-VN")}
                </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Tổng tests" value={summary.total} color="text-blue-400" />
                <SummaryCard label="Passed" value={summary.passed} color="text-[color:var(--success)]" />
                <SummaryCard label="Failed" value={summary.failed} color="text-[color:var(--danger)]" />
                <SummaryCard label="Pass Rate" value={`${passRate}%`} color={passRate >= 80 ? "text-[color:var(--success)]" : "text-[color:var(--warning)]"} />
            </div>

            {/* HTML Report Link */}
            {htmlReportAvailable && (
                <div className="glass-2 rounded-2xl p-4">
                    <p className="text-blue-300">
                        📄 HTML Report có sẵn. Chạy <code className="glass-1 rounded-lg px-2 py-1 text-sm">npx playwright show-report</code> để xem chi tiết.
                    </p>
                </div>
            )}

            {/* Test Cases Table */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">Test Cases</h2>
                {testCases.length === 0 ? (
                    <p className="text-[color:var(--fg-muted)] text-sm">
                        Chưa có kết quả. Chạy <code className="glass-1 rounded-lg px-2 py-1">npm run test:e2e</code> để tạo.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-800 text-gray-300">
                                    <th className="text-left p-3">#</th>
                                    <th className="text-left p-3">Test Name</th>
                                    <th className="text-left p-3">Trạng thái</th>
                                    <th className="text-right p-3">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {testCases.map((tc, i) => (
                                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-800/50">
                                        <td className="p-3 text-[color:var(--fg-muted)]">{i + 1}</td>
                                        <td className="p-3 text-gray-200">{tc.name}</td>
                                        <td className="p-3">
                                            <StatusBadge status={tc.status} />
                                        </td>
                                        <td className="p-3 text-right text-[color:var(--fg-muted)]">
                                            {tc.duration > 0 ? `${(tc.duration / 1000).toFixed(1)}s` : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Snapshots */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-3">
                    📸 Screenshots ({snapshots.length})
                </h2>
                {snapshots.length === 0 ? (
                    <p className="text-[color:var(--fg-muted)] text-sm">Chưa có screenshots.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {snapshots.map((snap, i) => (
                            <div key={i} className="glass-2 rounded-2xl p-3">
                                <p className="text-sm text-gray-300 truncate" title={snap.name}>
                                    {snap.name}
                                </p>
                                <p className="text-xs text-[color:var(--fg-muted)] mt-1">
                                    {(snap.size / 1024).toFixed(1)} KB •{" "}
                                    {new Date(snap.modified).toLocaleString("vi-VN")}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* How to Run */}
            <div className="glass-2 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">🏃 Cách chạy E2E tests</h3>
                <pre className="text-xs text-[color:var(--fg-muted)] whitespace-pre-wrap">{`# Chạy tất cả
npm run test:e2e

# Chạy riêng CRM critical
npx playwright test tests/e2e/crm-critical.spec.ts

# Chạy responsive
npx playwright test tests/e2e/responsive.spec.ts

# Xem report HTML
npm run test:e2e:report`}</pre>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
        <div className="glass-2 rounded-2xl p-4 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-[color:var(--fg-muted)] mt-1">{label}</div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cls =
        status === "passed"
            ? "bg-[var(--success-bg)] text-[color:var(--success)] border-[var(--border-subtle)]"
            : status === "failed"
                ? "bg-[var(--danger-bg)] text-red-300 border-[var(--border-subtle)]"
                : "bg-gray-700 text-gray-300 border-gray-600";
    return (
        <span className={`px-2 py-1 rounded text-xs border ${cls}`}>
            {status}
        </span>
    );
}
