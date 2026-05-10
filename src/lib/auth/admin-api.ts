import { canAccessAdminRoutes, hasRole } from "@/lib/auth/roles";
import { requireCurrentUser } from "@/lib/auth/session";
import type { ContentStatus, Role } from "@prisma/client";

export async function requireAdminActor() {
  const current = await requireCurrentUser();
  if (!canAccessAdminRoutes(current.profile.roles)) {
    throw new Error("FORBIDDEN");
  }
  return current;
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
