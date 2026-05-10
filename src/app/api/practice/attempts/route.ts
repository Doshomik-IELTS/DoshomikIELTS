import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";

export async function GET(request: Request) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const skip = (page - 1) * limit;

  const [attempts, total] = await Promise.all([
    prisma.practiceAttempt.findMany({
      where: { profileId: actor.profile.id },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
      },
    }),
    prisma.practiceAttempt.count({ where: { profileId: actor.profile.id } }),
  ]);

  const items = attempts.map((attempt) => ({
    id: attempt.id,
    practiceType: attempt.practiceType,
    score: attempt.scoreJson,
    feedback: attempt.feedbackJson,
    timeSpentSeconds: attempt.timeSpentSeconds,
    createdAt: attempt.createdAt,
    resource: attempt.resource
      ? {
          id: attempt.resource.id,
          title: attempt.resource.title,
          slug: attempt.resource.slug,
          category: attempt.resource.category,
        }
      : null,
  }));

  return ok({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}