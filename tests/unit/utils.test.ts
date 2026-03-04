import { describe, it, expect } from "vitest";

/* ── Test date-utils pure functions ── */
describe("date-utils", () => {
    it("todayInHoChiMinh should return YYYY-MM-DD format", async () => {
        const { todayInHoChiMinh } = await import("@/lib/date-utils");
        const today = todayInHoChiMinh();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("formatCurrencyVnd should format number", async () => {
        const { formatCurrencyVnd } = await import("@/lib/date-utils");
        const result = formatCurrencyVnd(1500000);
        expect(result).toBeTruthy();
        // Should contain the number in some format
        expect(result.replace(/[^\d]/g, "")).toContain("1500000");
    });

    it("formatCurrencyVnd should handle zero", async () => {
        const { formatCurrencyVnd } = await import("@/lib/date-utils");
        const result = formatCurrencyVnd(0);
        expect(result).toBeTruthy();
    });
});

/* ── Test ui-permissions ── */
describe("ui-permissions", () => {
    it("hasUiPermission should return true for valid permission", async () => {
        const { hasUiPermission } = await import("@/lib/ui-permissions");
        const perms = ["leads:VIEW", "receipts:CREATE"];
        expect(hasUiPermission(perms, "leads", "VIEW")).toBe(true);
    });

    it("hasUiPermission should return false for missing permission", async () => {
        const { hasUiPermission } = await import("@/lib/ui-permissions");
        const perms = ["leads:VIEW"];
        expect(hasUiPermission(perms, "leads", "CREATE")).toBe(false);
    });

    it("hasUiPermission should return false for null perms", async () => {
        const { hasUiPermission } = await import("@/lib/ui-permissions");
        expect(hasUiPermission(null, "leads", "VIEW")).toBe(false);
        expect(hasUiPermission(undefined, "leads", "VIEW")).toBe(false);
    });
});

/* ── Test admin-auth helpers ── */
describe("admin-auth", () => {
    it("isAdminRole should identify admin role", async () => {
        const { isAdminRole } = await import("@/lib/admin-auth");
        expect(isAdminRole("admin")).toBe(true);
        expect(isAdminRole("Admin")).toBe(true);
        expect(isAdminRole("telesales")).toBe(false);
        expect(isAdminRole("direct_page")).toBe(false);
    });

    it("isTelesalesRole should identify telesales", async () => {
        const { isTelesalesRole } = await import("@/lib/admin-auth");
        expect(isTelesalesRole("telesales")).toBe(true);
        expect(isTelesalesRole("admin")).toBe(false);
    });
});
