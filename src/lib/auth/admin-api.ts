import { canAccessAdminRoutes, hasRole } from "@/lib/auth/roles";
import { requireCurrentUser } from "@/lib/auth/session";
import { fail } from "@/lib/api/response";
import type { ContentStatus, Role } from "@prisma/client";

export type AdminActor = Awaited<ReturnType<typeof requireCurrentUser>>;

export async function requireAdminActor() {
  const current = await requireCurrentUser();
  if (!canAccessAdminRoutes(current.profile.roles)) {
    throw new Error("FORBIDDEN");
  }
  return current;
}

export function adminAuthErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }
  throw error;
}

export async function requireAdminActorOrResponse(): Promise<
  | { actor: AdminActor; response: null }
  | { actor: null; response: Response }
> {
  try {
    return { actor: await requireAdminActor(), response: null };
  } catch (error) {
    return { actor: null, response: adminAuthErrorResponse(error) };
  }
}

/** Who may set status to `published` (see resource-admin-dashboard-plan.md). */
export function canPublishResource(roles: Role[]) {
  return hasRole(roles, ["admin", "reviewer"]);
}

/** Only admins may archive (strict interpretation of plan). */
export function canArchiveResource(roles: Role[]) {
  return hasRole(roles, ["admin"]);
}

export function assertCanSetResourceStatus(roles: Role[], nextStatus: ContentStatus | undefined) {
  if (nextStatus === undefined) return;
  if (nextStatus === "published" && !canPublishResource(roles)) {
    throw new Error("FORBIDDEN_PUBLISH");
  }
  if (nextStatus === "archived" && !canArchiveResource(roles)) {
    throw new Error("FORBIDDEN_ARCHIVE");
  }
}
