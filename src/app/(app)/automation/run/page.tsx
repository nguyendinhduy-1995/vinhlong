"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, fetchMe, getToken } from "@/lib/auth-client";
import { hasUiPermission } from "@/lib/ui-permissions";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

type LeadItem = { id: string; fullName: string | null; phone: string | null };
type StudentItem = { id: string; lead?: { fullName: string | null; phone: string | null } | null };

export default function AutomationRunPage() {
  const router = useRouter();
  const toast = useToast();
  const [checking, setChecking] = useState(true);
  const [canRun, setCanRun] = useState(false);

  const [scope, setScope] = useState<"daily" | "manual">("manual");
  const [leadQuery, setLeadQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [leadOptions, setLeadOptions] = useState<LeadItem[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentItem[]>([]);
  const [leadId, setLeadId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchMe()
      .then((data) => {
        const hasRun = hasUiPermission(data.user.permissions, "automation_run", "RUN");
        setCanRun(hasRun);
        if (!hasRun) {
          router.replace("/leads?err=forbidden");
        }
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const timer = setTimeout(async () => {
      if (!leadQuery.trim()) {
        setLeadOptions([]);
        return;
      }
      setLoadingLead(true);
      try {
        const data = await fetchJson<{ items: LeadItem[] }>(`/api/leads?q=${encodeURIComponent(leadQuery)}&page=1&pageSize=20`, { token });
        setLeadOptions(data.items);
      } catch (e) {
        const err = e as ApiClientError;
        if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`);
      } finally {
        setLoadingLead(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [handleAuthError, leadQuery]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const timer = setTimeout(async () => {
      if (!studentQuery.trim()) {
        setStudentOptions([]);
        return;
      }
      setLoadingStudent(true);
      try {
        const data = await fetchJson<{ items: StudentItem[] }>(`/api/students?q=${encodeURIComponent(studentQuery)}&page=1&pageSize=20`, { token });
        setStudentOptions(data.items);
      } catch (e) {
        const err = e as ApiClientError;
        if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`);
      } finally {
        setLoadingStudent(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [handleAuthError, studentQuery]);

  async function submitRun() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const data = await fetchJson<{ log: { id: string; milestone: string } }>("/api/automation/run", {
        method: "POST",
        token,
        body: {
          scope,
          leadId: leadId || undefined,
          studentId: studentId || undefined,
          dryRun,
        },
      });
      toast.success("Đã chạy automation.");
      setTimeout(() => {
        router.push(`/automation/logs?scope=${data.log.milestone}&hl=${data.log.id}`);
      }, 450);
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`${err.code}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-[color:var(--fg)]">
        <Spinner /> Đang kiểm tra quyền...
      </div>
    );
  }

  if (!canRun) {
    return <Alert type="error" message="Bạn không có quyền truy cập." />;
  }

  return (
    <div className="space-y-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-4 animate-fade-in-up">        <div className="relative flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-bg)] text-xl">⚡</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Automation - Chạy tay</h2>
            <p className="text-sm text-[color:var(--fg-muted)]">Thực thi automation theo phạm vi và đối tượng chỉ định.</p>
          </div>
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}

      <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--fg-muted)]">🎯 Phạm vi</label>
            <Select value={scope} onChange={(e) => setScope(e.target.value as "daily" | "manual")}>
              <option value="manual">Thủ công</option>
              <option value="daily">Hằng ngày</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--fg-muted)]">👤 Tìm khách hàng</label>
            <Input value={leadQuery} onChange={(e) => setLeadQuery(e.target.value)} placeholder="Nhập tên hoặc SĐT" />
            {loadingLead ? <p className="mt-1 text-xs text-[color:var(--fg-muted)]">Đang tìm khách hàng...</p> : null}
            <Select value={leadId} onChange={(e) => setLeadId(e.target.value)} className="mt-2">
              <option value="">Không chọn</option>
              {leadOptions.map((lead) => (
                <option key={lead.id} value={lead.id}>{(lead.fullName || "Không tên") + " - " + (lead.phone || "Không SĐT")}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[color:var(--fg-muted)]">🎓 Tìm học viên</label>
            <Input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Nhập tên hoặc SĐT" />
            {loadingStudent ? <p className="mt-1 text-xs text-[color:var(--fg-muted)]">Đang tìm học viên...</p> : null}
            <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-2">
              <option value="">Không chọn</option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>{(student.lead?.fullName || "Không tên") + " - " + (student.lead?.phone || "Không SĐT")}</option>
              ))}
            </Select>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[color:var(--fg)]">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} className="rounded" />
            🧪 Chạy thử (dryRun)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => router.push("/automation/logs")}>📜 Xem nhật ký</Button>
            <Button onClick={submitRun} disabled={saving}>
              {saving ? "Đang chạy..." : "⚡ Chạy tự động hóa"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
