import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {
    status: "published",
  };

  if (type) {
    where.type = type;
  }

  const skip = (page - 1) * limit;

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        estimatedDurationMinutes: true,
        publishedAt: true,
        sections: {
          select: {
            id: true,
            module: true,
            partNumber: true,
            title: true,
            durationMinutes: true,
            orderIndex: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    }),
    prisma.test.count({ where }),
  ]);

  const items = tests.map((test) => {
    const moduleCount = test.sections.reduce(
      (acc, section) => {
        acc[section.module] = (acc[section.module] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      id: test.id,
      title: test.title,
      type: test.type,
      estimatedDurationMinutes: test.estimatedDurationMinutes,
      publishedAt: test.publishedAt,
      modules: Object.keys(moduleCount),
      sections: test.sections.length,
    };
  });

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