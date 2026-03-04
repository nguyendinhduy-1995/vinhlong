"use client";

import React from "react";

/* ═══════════════════════════════════════════════
   EmptyState — contextual empty list states
   ═══════════════════════════════════════════════ */

const PRESETS: Record<string, { icon: string; title: string; description: string }> = {
    leads: { icon: "📋", title: "Chưa có khách hàng", description: "Thêm khách hàng mới hoặc import danh sách để bắt đầu." },
    students: { icon: "🎓", title: "Chưa có học viên", description: "Học viên sẽ hiển thị khi khách hàng ghi danh khóa học." },
    courses: { icon: "📚", title: "Chưa có khóa học", description: "Tạo khóa học mới để bắt đầu quản lý." },
    receipts: { icon: "🧾", title: "Chưa có phiếu thu", description: "Phiếu thu sẽ xuất hiện khi có giao dịch thanh toán." },
    expenses: { icon: "💰", title: "Chưa có chi phí", description: "Thêm chi phí để theo dõi tài chính." },
    notifications: { icon: "🔔", title: "Không có thông báo", description: "Bạn đã xử lý hết thông báo rồi!" },
    events: { icon: "📅", title: "Chưa có sự kiện", description: "Các sự kiện sẽ xuất hiện khi có hoạt động." },
    search: { icon: "🔍", title: "Không tìm thấy kết quả", description: "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." },
    schedule: { icon: "📆", title: "Chưa có lịch", description: "Tạo lịch học mới cho học viên." },
    default: { icon: "📄", title: "Chưa có dữ liệu", description: "Dữ liệu sẽ xuất hiện khi có hoạt động." },
};

export function EmptyState({
    preset = "default",
    icon,
    title,
    description,
    action,
}: {
    preset?: keyof typeof PRESETS | string;
    icon?: string;
    title?: string;
    description?: string;
    action?: React.ReactNode;
}) {
    const p = PRESETS[preset] || PRESETS.default;
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in-up">
            <span className="text-5xl mb-4 block animate-scale-in">{icon || p.icon}</span>
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--fg)" }}>
                {title || p.title}
            </h3>
            <p className="text-sm max-w-xs" style={{ color: "var(--fg-muted)" }}>
                {description || p.description}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
