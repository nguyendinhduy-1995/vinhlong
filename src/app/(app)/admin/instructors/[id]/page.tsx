"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJson, type ApiClientError } from "@/lib/api-client";
import { clearToken, getToken } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Table } from "@/components/ui/table";
import { formatDateTimeVi } from "@/lib/date-utils";

type Instructor = {
    id: string; name: string; phone: string | null; status: string; note: string | null;
    studentCount: number; lessonCount: number; createdAt: string; updatedAt: string;
};
type StudentRow = { id: string; fullName: string | null; phone: string | null; studyStatus: string; courseCode: string | null };
type LessonRow = { id: string; studentName: string | null; startAt: string; endAt: string | null; lessonType: string; status: string; location: string | null };

const LESSON_TYPE_LABELS: Record<string, string> = { SA_HINH: "Sa hình", DUONG_TRUONG: "Đường trường", DAT: "Đất", CABIN: "Cabin", OTHER: "Khác" };
const LESSON_STATUS_LABELS: Record<string, string> = { SCHEDULED: "Đã lên lịch", DONE: "Hoàn thành", CANCELED: "Đã huỷ", NO_SHOW: "Vắng mặt" };

function parseError(e: unknown) { const err = e as ApiClientError; return err.message || "Lỗi không xác định"; }

export default function InstructorDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [tab, setTab] = useState<"overview" | "students" | "schedule">("overview");
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [lessons, setLessons] = useState<LessonRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editNote, setEditNote] = useState("");
    const [editStatus, setEditStatus] = useState("ACTIVE");
    const [saving, setSaving] = useState(false);

    // Assign modal
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignStudentId, setAssignStudentId] = useState("");
    const [assignError, setAssignError] = useState("");
    const [assigning, setAssigning] = useState(false);

    // Schedule modal
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [schedStudentId, setSchedStudentId] = useState("");
    const [schedStartAt, setSchedStartAt] = useState("");
    const [schedEndAt, setSchedEndAt] = useState("");
    const [schedType, setSchedType] = useState("SA_HINH");
    const [schedLocation, setSchedLocation] = useState("");
    const [schedError, setSchedError] = useState("");
    const [scheduling, setScheduling] = useState(false);

    const token = getToken();
    const guardAuth = useCallback((e: ApiClientError) => {
        if (e.code === "AUTH_MISSING_BEARER" || e.code === "AUTH_INVALID_TOKEN") { clearToken(); router.replace("/login"); return true; }
        return false;
    }, [router]);

    const load = useCallback(async () => {
        if (!token) { router.replace("/login"); return; }
        setLoading(true);
        setError("");
        try {
            const [inst, studs, less] = await Promise.all([
                fetchJson<Instructor>(`/api/instructors/${id}`, { token }),
                fetchJson<{ items: StudentRow[] }>(`/api/instructors/${id}/students`, { token }),
                fetchJson<{ items: LessonRow[] }>(`/api/practical-lessons?instructorId=${id}&pageSize=50`, { token }),
            ]);
            setInstructor(inst);
            setStudents(studs.items);
            setLessons(less.items);
            setEditName(inst.name); setEditPhone(inst.phone || ""); setEditNote(inst.note || ""); setEditStatus(inst.status);
        } catch (e) {
            const err = e as ApiClientError;
            if (!guardAuth(err)) setError(parseError(err));
        } finally { setLoading(false); }
    }, [id, token, router, guardAuth]);

    useEffect(() => { load(); }, [load]);

    async function handleSave() {
        if (!token || !editName.trim()) return;
        setSaving(true);
        try {
            await fetchJson(`/api/instructors/${id}`, { token, method: "PATCH", body: { name: editName.trim(), phone: editPhone.trim() || null, note: editNote.trim() || null, status: editStatus } });
            setEditing(false);
            load();
        } catch (e) { setError(parseError(e)); } finally { setSaving(false); }
    }

    async function handleDelete() {
        if (!token || !confirm("Bạn có chắc muốn ngừng giáo viên này?")) return;
        try {
            await fetchJson(`/api/instructors/${id}`, { token, method: "DELETE" });
            router.push("/admin/instructors");
        } catch (e) { setError(parseError(e)); }
    }

    async function handleAssign() {
        if (!token || !assignStudentId.trim()) { setAssignError("Nhập ID học viên"); return; }
        setAssigning(true); setAssignError("");
        try {
            await fetchJson(`/api/instructors/${id}/assign`, { token, method: "POST", body: { studentId: assignStudentId.trim() } });
            setAssignOpen(false); setAssignStudentId(""); load();
        } catch (e) { setAssignError(parseError(e)); } finally { setAssigning(false); }
    }

    async function handleSchedule() {
        if (!token || !schedStudentId.trim() || !schedStartAt) { setSchedError("Thiếu thông tin"); return; }
        setScheduling(true); setSchedError("");
        try {
            await fetchJson("/api/practical-lessons", {
                token, method: "POST", body: {
                    studentId: schedStudentId.trim(), instructorId: id, startAt: schedStartAt, endAt: schedEndAt || undefined, lessonType: schedType, location: schedLocation.trim() || undefined,
                }
            });
            setScheduleOpen(false); setSchedStudentId(""); setSchedStartAt(""); setSchedEndAt(""); load();
        } catch (e) { setSchedError(parseError(e)); } finally { setScheduling(false); }
    }

    if (loading) return <div className="animate-pulse space-y-3 p-4">{[1, 2, 3].map(i => <div key={i} className="h-8 rounded-xl bg-[var(--bg-elevated)]" />)}</div>;
    if (!instructor) return <Alert type="error" message={error || "Không tìm thấy"} />;

    const tabs: Array<{ key: typeof tab; label: string }> = [
        { key: "overview", label: "Tổng quan" },
        { key: "students", label: `Học viên (${students.length})` },
        { key: "schedule", label: `Lịch dạy (${lessons.length})` },
    ];

    return (
        <div className="space-y-4">
            {/* ── Premium Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 p-4 text-white shadow-lg shadow-teal-200 animate-fade-in-up">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--bg-inset)] blur-2xl" />
                <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-[var(--bg-inset)] blur-xl" />
                <div className="relative flex flex-wrap items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-2xl backdrop-blur-sm">👨‍🏫</div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{instructor.name}</h2>
                        <p className="text-sm text-[color:var(--fg-muted)]">SĐT: {instructor.phone || "—"}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleDelete} className="!bg-[var(--bg-elevated)] !text-white !border-white/30 hover:!bg-white/30">Ngừng</Button>
                        <Link href="/admin/instructors"><Button className="!bg-[var(--card-bg)] !text-[color:var(--accent)] hover:!bg-[var(--card-bg)]">← Danh sách</Button></Link>
                    </div>
                </div>
            </div>
            {error ? <Alert type="error" message={error} /> : null}

            <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
                <div className="flex gap-1 p-1">
                    {tabs.map((t) => (
                        <button key={t.key} type="button" onClick={() => setTab(t.key)}
                            className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === t.key ? "bg-[var(--accent-bg)] text-teal-800 shadow-sm" : "text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"}`}
                        >{t.label}</button>
                    ))}
                </div>
            </div>

            {/* TAB: Overview */}
            {tab === "overview" ? (
                <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                    <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
                    <div className="p-5">
                        <h3 className="text-sm font-semibold text-[color:var(--fg)] mb-3">📋 Thông tin giáo viên</h3>
                        {editing ? (
                            <div className="space-y-3 max-w-lg">
                                <div><label className="mb-1 block text-sm font-medium text-[color:var(--fg)]">Tên</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                                <div><label className="mb-1 block text-sm font-medium text-[color:var(--fg)]">SĐT</label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
                                <div><label className="mb-1 block text-sm font-medium text-[color:var(--fg)]">Trạng thái</label><Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Ngừng</option></Select></div>
                                <div><label className="mb-1 block text-sm font-medium text-[color:var(--fg)]">Ghi chú</label><Input value={editNote} onChange={(e) => setEditNote(e.target.value)} /></div>
                                <div className="flex gap-2"><Button onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button><Button variant="secondary" onClick={() => setEditing(false)}>Huỷ</Button></div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="glass-2 rounded-2xl p-3"><p className="text-xs uppercase text-[color:var(--fg-muted)]">Trạng thái</p><div className="mt-1">{instructor.status === "ACTIVE" ? <Badge text="Hoạt động" tone="success" /> : <Badge text="Ngừng" tone="neutral" />}</div></div>
                                    <div className="glass-2 rounded-2xl p-3"><p className="text-xs uppercase text-[color:var(--fg-muted)]">Số học viên</p><p className="mt-1 text-2xl font-semibold text-[color:var(--fg)]">{instructor.studentCount}</p></div>
                                    <div className="glass-2 rounded-2xl p-3"><p className="text-xs uppercase text-[color:var(--fg-muted)]">Tổng buổi dạy</p><p className="mt-1 text-2xl font-semibold text-[color:var(--fg)]">{instructor.lessonCount}</p></div>
                                    <div className="glass-2 rounded-2xl p-3"><p className="text-xs uppercase text-[color:var(--fg-muted)]">Ghi chú</p><p className="mt-1 text-sm text-[color:var(--fg)]">{instructor.note || "—"}</p></div>
                                </div>
                                <Button variant="secondary" onClick={() => setEditing(true)}>Chỉnh sửa</Button>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* TAB: Students */}
            {tab === "students" ? (
                <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                    <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
                    <div className="flex items-center justify-between p-3"><h3 className="text-sm font-semibold text-[color:var(--fg)]">👥 Học viên được gán</h3><Button onClick={() => setAssignOpen(true)}>+ Gán học viên</Button></div>
                    {students.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[color:var(--fg-muted)]">Chưa có học viên nào được gán</div>
                    ) : (
                        <Table headers={["Họ tên", "SĐT", "Trạng thái", "Khoá", "Hành động"]}>
                            {students.map((s, idx) => (
                                <tr key={s.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 30, 200)}ms` }}>
                                    <td className="px-3 py-2 font-medium text-[color:var(--fg)]">{s.fullName || "-"}</td>
                                    <td className="px-3 py-2 text-[color:var(--fg)]">{s.phone || "-"}</td>
                                    <td className="px-3 py-2"><Badge text={s.studyStatus} /></td>
                                    <td className="px-3 py-2 text-[color:var(--fg)]">{s.courseCode || "-"}</td>
                                    <td className="px-3 py-2"><Link href={`/students/${s.id}`} className="text-sm text-[color:var(--accent)] hover:underline">Xem</Link></td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </div>
            ) : null}

            {/* TAB: Schedule */}
            {tab === "schedule" ? (
                <div className="overflow-hidden glass-2 rounded-2xl animate-fade-in-up" style={{ animationDelay: "160ms" }}>
                    <div className="h-1 bg-gradient-to-r from-cyan-500 to-sky-500" />
                    <div className="flex items-center justify-between p-3"><h3 className="text-sm font-semibold text-[color:var(--fg)]">📅 Lịch dạy</h3><Button onClick={() => setScheduleOpen(true)}>+ Thêm lịch</Button></div>
                    {lessons.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[color:var(--fg-muted)]">Chưa có lịch dạy</div>
                    ) : (
                        <Table headers={["Học viên", "Thời gian", "Loại", "Trạng thái", "Địa điểm"]}>
                            {lessons.map((l, idx) => (
                                <tr key={l.id} className="border-t border-[var(--border-hairline)] transition-colors hover:bg-[var(--bg-elevated)] animate-fade-in-up" style={{ animationDelay: `${160 + Math.min(idx * 30, 200)}ms` }}>
                                    <td className="px-3 py-2 font-medium text-[color:var(--fg)]">{l.studentName || "-"}</td>
                                    <td className="px-3 py-2 text-[color:var(--fg)]">{formatDateTimeVi(l.startAt)}{l.endAt ? ` — ${formatDateTimeVi(l.endAt)}` : ""}</td>
                                    <td className="px-3 py-2"><Badge text={LESSON_TYPE_LABELS[l.lessonType] || l.lessonType} /></td>
                                    <td className="px-3 py-2"><Badge text={LESSON_STATUS_LABELS[l.status] || l.status} tone={l.status === "DONE" ? "success" : l.status === "CANCELED" ? "neutral" : "primary"} /></td>
                                    <td className="px-3 py-2 text-[color:var(--fg)]">{l.location || "—"}</td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </div>
            ) : null}

            {/* Modal: Assign Student */}
            <Modal open={assignOpen} title="Gán học viên" onClose={() => setAssignOpen(false)}>
                <div className="space-y-3">
                    {assignError ? <Alert type="error" message={assignError} /> : null}
                    <Input placeholder="ID học viên" value={assignStudentId} onChange={(e) => setAssignStudentId(e.target.value)} />
                    <div className="flex gap-2"><Button onClick={handleAssign} disabled={assigning}>{assigning ? "Đang gán..." : "Gán"}</Button><Button variant="secondary" onClick={() => setAssignOpen(false)}>Huỷ</Button></div>
                </div>
            </Modal>

            {/* Modal: Schedule Lesson */}
            <Modal open={scheduleOpen} title="Thêm buổi học" onClose={() => setScheduleOpen(false)}>
                <div className="space-y-3">
                    {schedError ? <Alert type="error" message={schedError} /> : null}
                    <Input placeholder="ID học viên" value={schedStudentId} onChange={(e) => setSchedStudentId(e.target.value)} />
                    <div><label className="mb-1 block text-sm text-[color:var(--fg)]">Bắt đầu</label><Input type="datetime-local" value={schedStartAt} onChange={(e) => setSchedStartAt(e.target.value)} /></div>
                    <div><label className="mb-1 block text-sm text-[color:var(--fg)]">Kết thúc</label><Input type="datetime-local" value={schedEndAt} onChange={(e) => setSchedEndAt(e.target.value)} /></div>
                    <Select value={schedType} onChange={(e) => setSchedType(e.target.value)}><option value="SA_HINH">Sa hình</option><option value="DUONG_TRUONG">Đường trường</option><option value="DAT">Đất</option><option value="CABIN">Cabin</option><option value="OTHER">Khác</option></Select>
                    <Input placeholder="Địa điểm" value={schedLocation} onChange={(e) => setSchedLocation(e.target.value)} />
                    <div className="flex gap-2"><Button onClick={handleSchedule} disabled={scheduling}>{scheduling ? "Đang lưu..." : "Tạo lịch"}</Button><Button variant="secondary" onClick={() => setScheduleOpen(false)}>Huỷ</Button></div>
                </div>
            </Modal>
        </div>
    );
}
