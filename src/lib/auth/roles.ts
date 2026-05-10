import type { AppRole, Role } from "@prisma/client";

/** Roles that may access `/admin` UI and admin APIs (see security-and-compliance.md). */
export const ADMIN_ACCESS_ROLES: AppRole[] = ["admin", "reviewer", "evaluator"];

export function hasRole(roles: Role[], allowed: AppRole[]) {
  return roles.some((role) => allowed.includes(role.role));
}

export function canAccessAdminRoutes(roles: Role[]) {
  return hasRole(roles, ADMIN_ACCESS_ROLES);
}
