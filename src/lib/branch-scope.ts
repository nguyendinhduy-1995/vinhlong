/**
 * Branch-scoping helpers for CRM V2.
 *
 * Non-admin users with a branchId see only their branch's data.
 * Admin / manager without branchId see all branches.
 */
import { prisma } from "@/lib/prisma";
import type { AuthPayload } from "@/lib/auth";

export type BranchScope = {
    /** The user's branchId, or null if global access */
    branchId: string | null;
    /** The user's DB id (from JWT sub) */
    userId: string;
    /** Role string */
    role: string;
    /** Whether the user has global (all-branch) access */
    isGlobal: boolean;
};

// Cache user branchId lookups for the request lifetime (simple in-memory)
const branchCache = new Map<string, string | null>();

/**
 * Resolve the branch scope for the authenticated user.
 * Admin role always gets global access.
 * Other roles are scoped to their branch.
 */
export async function resolveBranchScope(auth: AuthPayload): Promise<BranchScope> {
    const isAdmin = auth.role === "admin";

    // Admin always has global access
    if (isAdmin) {
        return { branchId: null, userId: auth.sub, role: auth.role, isGlobal: true };
    }

    // Check cache first
    let branchId = branchCache.get(auth.sub);
    if (branchId === undefined) {
        const user = await prisma.user.findUnique({
            where: { id: auth.sub },
            select: { branchId: true },
        });
        branchId = user?.branchId ?? null;
        branchCache.set(auth.sub, branchId);

        // Auto-evict after 60s to avoid stale data
        setTimeout(() => branchCache.delete(auth.sub), 60_000);
    }

    // Manager without branchId gets global access
    if (auth.role === "manager" && !branchId) {
        return { branchId: null, userId: auth.sub, role: auth.role, isGlobal: true };
    }

    return {
        branchId,
        userId: auth.sub,
        role: auth.role,
        isGlobal: false,
    };
}

/**
 * Build a Prisma `where` filter for branch-scoped queries.
 * Returns `{}` for global access, or `{ branchId }` for scoped access.
 */
export function branchFilter(scope: BranchScope): { branchId?: string } {
    if (scope.isGlobal || !scope.branchId) return {};
    return { branchId: scope.branchId };
}

/**
 * Build a Prisma `where` filter for owner-scoped queries.
 * For branch staff (telesales), also filter by ownerId.
 * For page staff (direct_page), show unassigned leads.
 */
export function ownerFilter(scope: BranchScope): { ownerId?: string | null } {
    if (scope.isGlobal) return {};
    if (scope.role === "telesales") return { ownerId: scope.userId };
    // direct_page sees all leads (they're the inbox)
    return {};
}

/**
 * Check if the user's role is a "page" role (central page operator).
 */
export function isPageRole(role: string): boolean {
    return role === "direct_page";
}

/**
 * Check if the user's role is a "branch" role (branch operator).
 */
export function isBranchRole(role: string): boolean {
    return role === "telesales";
}
