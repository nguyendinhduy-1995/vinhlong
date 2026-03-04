import { describe, it, expect } from "vitest";

/* ── Test admin-menu integrity ── */
describe("admin-menu", () => {
    it("should export ADMIN_MENU with all required fields", async () => {
        const { ADMIN_MENU } = await import("@/lib/admin-menu");
        expect(ADMIN_MENU.length).toBeGreaterThan(30);
        for (const item of ADMIN_MENU) {
            expect(item.key).toBeTruthy();
            expect(item.label).toBeTruthy();
            expect(item.href).toBeTruthy();
            expect(item.group).toBeTruthy();
        }
    });

    it("should have unique keys", async () => {
        const { ADMIN_MENU } = await import("@/lib/admin-menu");
        const keys = ADMIN_MENU.map((m) => m.key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("all hrefs should start with /", async () => {
        const { ADMIN_MENU } = await import("@/lib/admin-menu");
        for (const item of ADMIN_MENU) {
            expect(item.href.startsWith("/")).toBe(true);
        }
    });

    it("should have GROUP_COLORS for all groups used", async () => {
        const { ADMIN_MENU, GROUP_COLORS } = await import("@/lib/admin-menu");
        const groups = new Set(ADMIN_MENU.map((m) => m.group));
        for (const group of groups) {
            expect(GROUP_COLORS[group]).toBeDefined();
        }
    });
});

/* ── Test leads/types pure functions ── */
describe("leads/types helpers", () => {
    it("STATUS_LABELS should have all standard statuses", async () => {
        const { STATUS_LABELS } = await import("@/app/(app)/leads/types");
        expect(STATUS_LABELS["NEW"]).toBe("Mới");
        expect(STATUS_LABELS["HAS_PHONE"]).toBe("Đã có SĐT");
        expect(STATUS_LABELS["APPOINTED"]).toBe("Đã hẹn");
        expect(STATUS_LABELS["ARRIVED"]).toBe("Đã đến");
        expect(STATUS_LABELS["SIGNED"]).toBe("Đã ghi danh");
        expect(STATUS_LABELS["LOST"]).toBe("Mất");
    });

    it("STATUS_OPTIONS should be a non-empty string array", async () => {
        const { STATUS_OPTIONS } = await import("@/app/(app)/leads/types");
        expect(Array.isArray(STATUS_OPTIONS)).toBe(true);
        expect(STATUS_OPTIONS.length).toBeGreaterThan(5);
        expect(STATUS_OPTIONS).toContain("NEW");
        expect(STATUS_OPTIONS).toContain("LOST");
    });

    it("EVENT_OPTIONS should include CALLED", async () => {
        const { EVENT_OPTIONS } = await import("@/app/(app)/leads/types");
        expect(EVENT_OPTIONS).toContain("CALLED");
    });

    it("INITIAL_FILTERS should have empty string defaults", async () => {
        const { INITIAL_FILTERS } = await import("@/app/(app)/leads/types");
        expect(INITIAL_FILTERS.q).toBe("");
        expect(INITIAL_FILTERS.status).toBe("");
        expect(INITIAL_FILTERS.source).toBe("");
    });

    it("statusStyle should return valid style for known status", async () => {
        const { statusStyle } = await import("@/app/(app)/leads/types");
        const style = statusStyle("NEW");
        expect(style).toBeDefined();
        expect(style.bg).toBeTruthy();
        expect(style.text).toBeTruthy();
        expect(style.gradient).toBeTruthy();
    });

    it("statusStyle should return fallback for unknown status", async () => {
        const { statusStyle } = await import("@/app/(app)/leads/types");
        const style = statusStyle("NONEXISTENT");
        expect(style).toBeDefined();
        expect(style.icon).toBeDefined();
    });

    it("formatError should format error correctly", async () => {
        const { formatError } = await import("@/app/(app)/leads/types");
        const result = formatError({ code: "TEST_ERR", message: "test message" } as { code: string; message: string });
        expect(result).toBe("TEST_ERR: test message");
    });
});
