/* ═══════════════════════════════════════════════════════════════
   Students — Shared Types & Helpers
   ═══════════════════════════════════════════════════════════════ */

/* ── Types ── */
export type StudentDetail = {
    id: string;
    leadId: string;
    courseId: string | null;
    tuitionPlanId: string | null;
    tuitionSnapshot: number | null;
    studyStatus: string;
    examStatus: string | null;
    examResult: string | null;
    createdAt: string;
    updatedAt: string;
    lead: {
        id: string;
        fullName: string | null;
        phone: string | null;
        status: string;
        ownerId: string | null;
    };
    course: { id: string; code: string } | null;
    instructor: { id: string; name: string; phone: string | null } | null;
    tuitionPlan: {
        id: string;
        province: string;
        licenseType: string;
        tuition: number;
        totalAmount?: number;
        paid50Amount?: number;
        note?: string | null;
        isActive?: boolean;
    } | null;
};

export type InstructorOption = {
    id: string;
    name: string;
    phone: string | null;
    status: string;
};

export type ReceiptItem = {
    id: string;
    studentId: string;
    amount: number;
    method: "cash" | "bank_transfer" | "card" | "other";
    note: string | null;
    receivedAt: string;
};

export type ReceiptListResponse = {
    items: ReceiptItem[];
    page: number;
    pageSize: number;
    total: number;
};

export type FormState = {
    amount: string;
    method: "cash" | "bank" | "momo" | "other";
    receivedAt: string;
    note: string;
};

export type LeadEvent = {
    id: string;
    leadId: string;
    type: string;
    note?: string | null;
    payload?: unknown;
    createdAt: string;
};

export type AutomationLog = {
    id: string;
    leadId: string | null;
    studentId: string | null;
    milestone: string | null;
    status: string;
    sentAt: string;
    payload?: unknown;
};

export type TimelineSource = "event" | "receipt" | "automation";
export type TimelineFilter = "all" | TimelineSource;
export type TimelineItem = {
    id: string;
    source: TimelineSource;
    time: string;
    title: string;
    summary: string;
    badgeMain: string;
    badgeSub?: string;
    raw: unknown;
};

export type TuitionPlan = {
    id: string;
    province: string;
    licenseType: "B" | "C1";
    totalAmount: number;
    paid50Amount: number;
    tuition: number;
    isActive: boolean;
};

export type TuitionPlansResponse = {
    items: TuitionPlan[];
    page: number;
    pageSize: number;
    total: number;
};

export type StudentFinance = {
    tuitionTotal: number;
    paidTotal: number;
    remaining: number;
    paidRatio: number;
    paid50: boolean;
};

export type OutboundMessageItem = {
    id: string;
    channel: "ZALO" | "FB" | "SMS" | "CALL_NOTE";
    templateKey: string;
    renderedText: string;
    status: "QUEUED" | "SENT" | "FAILED" | "SKIPPED";
    error: string | null;
    to: string | null;
    createdAt: string;
    sentAt: string | null;
};

/* ── Helpers ── */
export function formatMethod(value: ReceiptItem["method"]) {
    if (value === "cash") return "Tiền mặt";
    if (value === "bank_transfer") return "Chuyển khoản";
    if (value === "card") return "Thẻ";
    return "Momo/Khác";
}

export function getRuntimeStatus(payload: unknown, fallback: string) {
    if (
        payload &&
        typeof payload === "object" &&
        "runtimeStatus" in payload &&
        typeof (payload as { runtimeStatus?: unknown }).runtimeStatus === "string"
    ) {
        return (payload as { runtimeStatus: string }).runtimeStatus;
    }
    return fallback === "failed" ? "failed" : "success";
}

export function studyStatusLabel(value: string) {
    if (value === "studying") return "Đang học";
    if (value === "paused") return "Tạm dừng";
    if (value === "done") return "Hoàn thành";
    return value;
}

export function outboundChannelLabel(channel: OutboundMessageItem["channel"]) {
    if (channel === "ZALO") return "Zalo";
    if (channel === "FB") return "Facebook";
    if (channel === "SMS") return "SMS";
    return "Ghi chú gọi";
}

export function outboundStatusLabel(status: OutboundMessageItem["status"]) {
    if (status === "QUEUED") return "Đang chờ";
    if (status === "SENT") return "Đã gửi";
    if (status === "FAILED") return "Thất bại";
    return "Bỏ qua";
}
