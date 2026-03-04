"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, getToken } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table } from "@/components/ui/table";
import { formatDateTimeVi } from "@/lib/date-utils";
import { exportCsv } from "@/lib/csv-export";
import { ExportButton } from "@/components/ds/export-button";

type StudyStatus = "studying" | "paused" | "done";

type StudentItem = {
  id: string;
  leadId: string;
  studyStatus: StudyStatus;
  createdAt: string;
  lead: {
    id: string;
    fullName: string | null;
    phone: string | null;
    status: string;
  };
  course: {
    id: string;
    code: string;
  } | null;
};

type StudentsResponse = {
  items: StudentItem[];
  page: number;
  pageSize: number;
  total: number;
};

type CourseItem = {
  id: string;
  code: string;
};

type CoursesResponse = {
  items: CourseItem[];
};

type LeadOption = {
  id: string;
  fullName: string | null;
  phone: string | null;
  status: string;
};

type LeadsResponse = {
  items: LeadOption[];
};

type PendingStatusChange = {
  studentId: string;
  prevStatus: StudyStatus;
  nextStatus: StudyStatus;
};

const STATUS_OPTIONS: Array<{ value: StudyStatus; label: string }> = [
  { value: "studying", label: "Đang học" },
  { value: "paused", label: "Tạm dừng" },
  { value: "done", label: "Hoàn thành" },
];

function parseApiError(err: ApiClientError) {
  return `${err.code}: ${err.message}`;
}

function statusLabel(status: StudyStatus) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
}

const STATUS_STYLE: Record<string, { icon: string; bg: string; text: string; border: string; gradient: string }> = {
  studying: { icon: "📚", bg: "bg-[var(--success-bg)]", text: "text-[color:var(--success-fg)]", border: "border-[var(--border-subtle)]", gradient: "from-emerald-500 to-green-600" },
  paused: { icon: "⏸️", bg: "bg-[var(--warning-bg)]", text: "text-[color:var(--warning-fg)]", border: "border-[var(--border-subtle)]", gradient: "from-amber-500 to-orange-500" },
  done: { icon: "🎓", bg: "bg-[var(--accent-bg)]", text: "text-[color:var(--accent)]", border: "border-[var(--border-subtle)]", gradient: "from-blue-500 to-indigo-500" },
};

function getStudyStyle(status: string) {
  return STATUS_STYLE[status] || STATUS_STYLE.studying;
}

function StudentsSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 surface rounded-xl p-3">
          <div className="h-9 w-9 rounded-full bg-[var(--bg-elevated)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-[var(--bg-elevated)]" />
            <div className="h-3 w-1/4 rounded bg-[var(--bg-inset)]" />
          </div>
          <div className="h-6 w-16 rounded-full bg-[var(--bg-elevated)]" />
        </div>
      ))}
    </div>
  );
}

export default function StudentsPage() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<StudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [courseId, setCourseId] = useState("");
  const [studyStatus, setStudyStatus] = useState<"" | StudyStatus>("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [leadQueryInput, setLeadQueryInput] = useState("");
  const [leadQuery, setLeadQuery] = useState("");
  const [leadOptions, setLeadOptions] = useState<LeadOption[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [createForm, setCreateForm] = useState<{
    leadId: string;
    courseId: string;
    studyStatus: StudyStatus;
  }>({
    leadId: "",
    courseId: "",
    studyStatus: "studying",
  });

  const [pendingStatus, setPendingStatus] = useState<PendingStatusChange | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("sort", "createdAt");
    params.set("order", "desc");
    if (courseId) params.set("courseId", courseId);
    if (studyStatus) params.set("studyStatus", studyStatus);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [courseId, page, pageSize, q, studyStatus]);

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

  const loadStudents = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson<StudentsResponse>(`/api/students?${queryString}`, { token });
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`Có lỗi xảy ra: ${parseApiError(err)}`);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, queryString]);

  const loadCourses = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setCoursesLoading(true);
    try {
      const data = await fetchJson<CoursesResponse>("/api/courses?page=1&pageSize=100", { token });
      setCourses(data.items);
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`Không tải được danh sách khóa học: ${parseApiError(err)}`);
    } finally {
      setCoursesLoading(false);
    }
  }, [handleAuthError]);

  const loadLeads = useCallback(
    async (keyword: string) => {
      const token = getToken();
      if (!token) return;
      setLeadsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("pageSize", "20");
        params.set("sort", "createdAt");
        params.set("order", "desc");
        if (keyword.trim()) params.set("q", keyword.trim());
        const data = await fetchJson<LeadsResponse>(`/api/leads?${params.toString()}`, { token });
        setLeadOptions(data.items);
      } catch (e) {
        const err = e as ApiClientError;
        if (!handleAuthError(err)) setError(`Không tải được danh sách khách hàng: ${parseApiError(err)}`);
      } finally {
        setLeadsLoading(false);
      }
    },
    [handleAuthError]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLeadQuery(leadQueryInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [leadQueryInput]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (!createOpen) return;
    loadLeads(leadQuery);
  }, [createOpen, leadQuery, loadLeads]);

  function openCreateModal() {
    setCreateOpen(true);
    setLeadQueryInput("");
    setLeadQuery("");
    setCreateForm({ leadId: "", courseId: "", studyStatus: "studying" });
  }

  async function createStudent() {
    const token = getToken();
    if (!token) return;

    if (!createForm.leadId) {
      setError("Vui lòng chọn khách hàng để tạo học viên.");
      return;
    }

    setCreateSaving(true);
    setError("");
    try {
      const payload = {
        leadId: createForm.leadId,
        courseId: createForm.courseId || null,
        studyStatus: createForm.studyStatus,
      };
      const response = await fetchJson<{ student: { id: string } }>("/api/students", {
        method: "POST",
        token,
        body: payload,
      });
      setCreateOpen(false);
      toast.success("Tạo học viên thành công.");
      router.push(`/students/${response.student.id}`);
    } catch (e) {
      const err = e as ApiClientError;
      if (!handleAuthError(err)) setError(`Không thể tạo học viên: ${parseApiError(err)}`);
    } finally {
      setCreateSaving(false);
    }
  }

  function askStatusChange(studentId: string, current: StudyStatus, next: StudyStatus) {
    if (current === next) return;
    setItems((prev) => prev.map((item) => (item.id === studentId ? { ...item, studyStatus: next } : item)));
    setPendingStatus({ studentId, prevStatus: current, nextStatus: next });
  }

  function rollbackStatusChange(change: PendingStatusChange) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === change.studentId
          ? {
            ...item,
            studyStatus: change.prevStatus,
          }
          : item
      )
    );
  }

  async function confirmStatusChange() {
    if (!pendingStatus) return;
    const token = getToken();
    if (!token) return;
    setStatusSaving(true);
    setError("");

    try {
      await fetchJson(`/api/students/${pendingStatus.studentId}`, {
        method: "PATCH",
        token,
        body: { studyStatus: pendingStatus.nextStatus },
      });
      toast.success("Đã cập nhật trạng thái học viên.");
      setPendingStatus(null);
    } catch (e) {
      const err = e as ApiClientError;
      rollbackStatusChange(pendingStatus);
      if (!handleAuthError(err)) setError(`Không thể cập nhật trạng thái: ${parseApiError(err)}`);
      setPendingStatus(null);
    } finally {
      setStatusSaving(false);
    }
  }

  function cancelStatusChange() {
    if (pendingStatus) rollbackStatusChange(pendingStatus);
    setPendingStatus(null);
  }

  return (
    <div className="space-y-4">
      {/* ── Premium Header ── */}
      <div className="glass-2 rounded-2xl p-5 animate-spring-in">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>Học viên</h2>
            <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>Quản lý học viên & theo dõi tiến độ</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={loadStudents} disabled={loading}>
              {loading ? <span className="flex items-center gap-2"><Spinner /> Đang tải...</span> : "Làm mới"}
            </Button>
            <Button onClick={openCreateModal}>+ Tạo học viên</Button>
            <ExportButton
              onClick={() => exportCsv("hoc-vien", [
                { header: "Học viên", accessor: (r: StudentItem) => r.lead.fullName },
                { header: "SĐT", accessor: (r: StudentItem) => r.lead.phone },
                { header: "Khóa học", accessor: (r: StudentItem) => r.course?.code },
                { header: "Trạng thái học", accessor: (r: StudentItem) => r.studyStatus === "studying" ? "Đang học" : r.studyStatus === "paused" ? "Tạm dừng" : "Hoàn thành" },
                { header: "Ngày tạo", accessor: (r: StudentItem) => formatDateTimeVi(r.createdAt) },
              ], items)}
            />
          </div>
        </div>
        {/* Stats */}
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const count = items.filter((i) => i.studyStatus === opt.value).length;
            return (
              <span key={opt.value} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: 'var(--bg-inset)', color: 'var(--fg-secondary)' }}>
                {opt.label}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {error ? <Alert type="error" message={error} /> : null}


      <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="p-4">
          <h3 className="mb-3 text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>
            Bộ lọc
          </h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-[color:var(--fg-muted)]">Khóa học</label>
              <Select
                value={courseId}
                onChange={(e) => { setPage(1); setCourseId(e.target.value); }}
                disabled={coursesLoading}
              >
                <option value="">Tất cả khóa học</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.code}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[color:var(--fg-muted)]">Trạng thái học</label>
              <Select
                value={studyStatus}
                onChange={(e) => { setPage(1); setStudyStatus(e.target.value as "" | StudyStatus); }}
              >
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[color:var(--fg-muted)]">Tìm kiếm</label>
              <Input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Tìm tên hoặc SĐT" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[color:var(--fg-muted)]">Kích thước trang</label>
              <Select value={String(pageSize)} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <StudentsSkeleton />
      ) : items.length === 0 ? (
        <div className="glass-2 rounded-2xl p-8 text-center animate-fade-in-up">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-inset)] text-2xl">💭</div>
          <p className="font-medium text-[color:var(--fg)]">Không có dữ liệu học viên</p>
          <p className="mt-1 text-sm text-[color:var(--fg-muted)]">Điều chỉnh bộ lọc hoặc tạo học viên mới.</p>
        </div>
      ) : (
        <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <Table headers={["Học viên", "SĐT", "Khóa học", "Trạng thái", "Ngày tạo", "Hành động"]}>
            {items.map((item, idx) => {
              const s = getStudyStyle(item.studyStatus);
              return (
                <tr key={item.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${200 + Math.min(idx * 40, 300)}ms` }}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} text-sm`}>{s.icon}</span>
                      <div>
                        <div className="font-medium text-[color:var(--fg)]">{item.lead.fullName || "Chưa có tên"}</div>
                        <div className="text-[11px] text-[color:var(--fg-muted)] font-mono">{item.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-sm">{item.lead.phone || "-"}</td>
                  <td className="px-3 py-2 text-sm">{item.course?.code || "-"}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full ${s.bg} ${s.text} border ${s.border} px-2 py-0.5 text-xs font-bold`}>
                      {s.icon} {statusLabel(item.studyStatus)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-[color:var(--fg-secondary)]">{formatDateTimeVi(item.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/students/${item.id}`}
                        className={`inline-flex items-center gap-1 rounded-2xl border ${s.border} ${s.bg} px-2.5 py-1.5 text-xs font-bold ${s.text} transition hover:shadow-sm`}
                      >
                        Mở
                      </Link>
                      <Select
                        className="min-w-[140px]"
                        value={item.studyStatus}
                        onChange={(e) => askStatusChange(item.id, item.studyStatus, e.target.value as StudyStatus)}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </Select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <Modal open={createOpen} title="Tạo học viên" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Tìm khách hàng</label>
            <Input
              placeholder="Nhập tên hoặc SĐT"
              value={leadQueryInput}
              onChange={(e) => setLeadQueryInput(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Chọn khách hàng</label>
            <Select
              value={createForm.leadId}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, leadId: e.target.value }))}
            >
              <option value="">Chọn một khách hàng</option>
              {leadOptions.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {(lead.fullName || "Chưa có tên") + " - " + (lead.phone || "Không SĐT")}
                </option>
              ))}
            </Select>
            {leadsLoading ? <p className="mt-1 text-xs text-[color:var(--fg-muted)]">Đang tải khách hàng...</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Khóa học</label>
            <Select
              value={createForm.courseId}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, courseId: e.target.value }))}
            >
              <option value="">Chưa gán khóa học</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-[color:var(--fg-secondary)]">Trạng thái ban đầu</label>
            <Select
              value={createForm.studyStatus}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, studyStatus: e.target.value as StudyStatus }))
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={createStudent} disabled={createSaving}>
              {createSaving ? "Đang tạo..." : "Tạo học viên"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(pendingStatus)} title="Xác nhận đổi trạng thái" onClose={cancelStatusChange}>
        <p className="text-sm text-[color:var(--fg)]">Đổi trạng thái học viên?</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={cancelStatusChange}>
            Huỷ
          </Button>
          <Button onClick={confirmStatusChange} disabled={statusSaving}>
            {statusSaving ? "Đang cập nhật..." : "Xác nhận"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
