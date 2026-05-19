import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { logRouteError } from "@/lib/api/logging";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  try {
    const rows = await prisma.resource.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const resourcesByStatus = Object.fromEntries(
      rows.map((r) => [r.status, r._count.id]),
    ) as Record<string, number>;

    return ok({
      resourcesByStatus: {
        draft: resourcesByStatus.draft ?? 0,
        review: resourcesByStatus.review ?? 0,
        published: resourcesByStatus.published ?? 0,
        archived: resourcesByStatus.archived ?? 0,
      },
    });
  } catch (error) {
    logRouteError("/api/admin/stats", error, { method: request.method });
    return fail({ code: "INTERNAL_ERROR", message: "Could not load stats." }, 500);
  }
}
