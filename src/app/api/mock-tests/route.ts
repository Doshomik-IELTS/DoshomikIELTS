import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { paginateArray, paginationSchema, parseQuery } from "@/lib/api/validation";
import { fetchStrapiMockTests } from "@/lib/strapi/content";
import { z } from "zod";

const querySchema = paginationSchema.extend({
  type: z.enum(["practice", "short_mock", "full_mock"]).optional(),
});

export async function GET(request: Request) {
  try {
    await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const parsedQuery = parseQuery(request, querySchema);
  if (parsedQuery.response) return parsedQuery.response;
  const { type, page, limit } = parsedQuery.data;

  const strapiTests = await fetchStrapiMockTests(type);
  if (strapiTests) {
    return ok(paginateArray(strapiTests, page, limit));
  }

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
