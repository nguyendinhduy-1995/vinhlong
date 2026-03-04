/* ═══════════════════════════════════════════════════════════════
   Leads — Shared Types, Constants & Helpers
   ═══════════════════════════════════════════════════════════════ */

import type { ApiClientError } from "@/lib/api-client";

/* ── Types ── */
export type Lead = {
    id: string;
    fullName: string | null;
    phone: string | null;
    province: string | null;
    licenseType: string | null;
    source: string | null;
    channel: string | null;
    status: string;
    ownerId: string | null;
    note: string | null;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    owner?: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        isActive: boolean;
    } | null;
};

export type LeadListResponse = {
    items: Lead[];
    page: number;
    pageSize: number;
    total: number;
    statusCounts?: Record<string, number>;
};

export type LeadDetailResponse = { lead: Lead };

export type LeadEvent = {
    id: string;
    leadId: string;
    type: string;
    payload?: unknown;
    createdAt: string;
    createdById?: string | null;
};

export type LeadEventsResponse = { items: LeadEvent[] };

export type UserOption = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    isActive: boolean;
};

export type UsersResponse = { items: UserOption[] };

export type Filters = {
    status: string;
    source: string;
    channel: string;
    licenseType: string;
    ownerId: string;
    q: string;
    createdFrom: string;
    createdTo: string;
};

/* ── Constants ── */
export const STATUS_OPTIONS = ["NEW", "HAS_PHONE", "APPOINTED", "ARRIVED", "SIGNED", "STUDYING", "EXAMED", "RESULT", "LOST"];
export const EVENT_OPTIONS = [...STATUS_OPTIONS, "CALLED"];

export const STATUS_LABELS: Record<string, string> = {
    NEW: "Mới",
    HAS_PHONE: "Đã có SĐT",
    APPOINTED: "Đã hẹn",
    ARRIVED: "Đã đến",
    SIGNED: "Đã ghi danh",
    STUDYING: "Đang học",
    EXAMED: "Đã thi",
    RESULT: "Có kết quả",
    LOST: "Mất",
    CALLED: "Đã gọi",
};

export const STATUS_STYLE: Record<string, { icon: string; bg: string; text: string; border: string; gradient: string }> = {
    NEW: { icon: "", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", gradient: "from-blue-500 to-cyan-500" },
    HAS_PHONE: { icon: "", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", gradient: "from-teal-500 to-emerald-500" },
    APPOINTED: { icon: "", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", gradient: "from-orange-500 to-amber-500" },
    ARRIVED: { icon: "", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", gradient: "from-purple-500 to-violet-500" },
    SIGNED: { icon: "", bg: "bg-[var(--success-bg)]", text: "text-[color:var(--success-fg)]", border: "border-[var(--border-subtle)]", gradient: "from-emerald-500 to-green-600" },
    STUDYING: { icon: "", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", gradient: "from-indigo-500 to-blue-600" },
    EXAMED: { icon: "", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", gradient: "from-sky-500 to-blue-500" },
    RESULT: { icon: "", bg: "bg-[var(--warning-bg)]", text: "text-[color:var(--warning-fg)]", border: "border-[var(--border-subtle)]", gradient: "from-amber-500 to-yellow-500" },
    LOST: { icon: "", bg: "bg-[var(--danger-bg)]", text: "text-red-700", border: "border-[var(--border-subtle)]", gradient: "from-red-500 to-rose-500" },
    CALLED: { icon: "", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", gradient: "from-cyan-500 to-teal-500" },
};

export const INITIAL_FILTERS: Filters = {
    status: "",
    source: "",
    channel: "",
    licenseType: "",
    ownerId: "",
    q: "",
    createdFrom: "",
    createdTo: "",
};

/* ── Helpers ── */
export function statusStyle(status: string) {
    return STATUS_STYLE[status] || STATUS_STYLE.NEW;
}

export function formatError(err: ApiClientError) {
    return `${err.code}: ${err.message}`;
}
