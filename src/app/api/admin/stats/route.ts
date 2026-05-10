import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return fail({ code: "FORBIDDEN", message: "Admin access required." }, 403);
    }
    throw error;
  }

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
  } catch {
    return fail({ code: "INTERNAL_ERROR", message: "Could not load stats." }, 500);
  }
}
