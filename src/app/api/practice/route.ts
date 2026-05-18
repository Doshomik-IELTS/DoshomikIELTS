import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { paginationSchema, parseQuery } from "@/lib/api/validation";
import { z } from "zod";

const querySchema = paginationSchema.extend({
  type: z.enum(["vocabulary", "synonym", "grammar", "reading", "listening"]).optional(),
  category: z.string().trim().min(1).max(64).optional(),
  difficulty: z.string().trim().min(1).max(32).optional(),
});

export async function GET(request: Request) {
  try {
    await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const parsedQuery = parseQuery(request, querySchema);
  if (parsedQuery.response) return parsedQuery.response;
  const { type, category, difficulty, page, limit } = parsedQuery.data;

  const where: Record<string, unknown> = {
    status: "published",
  };

  if (type) {
    const typeToCategory: Record<string, string> = {
      vocabulary: "words",
      synonym: "synonyms",
      grammar: "grammar",
      reading: "reading_strategy",
      listening: "listening_strategy",
    };
    if (typeToCategory[type]) {
      where.category = typeToCategory[type];
    }
  }

  if (category) {
    where.category = category;
  }

  if (difficulty) {
    where.difficulty = difficulty;
  }

  const skip = (page - 1) * limit;

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        difficulty: true,
        body: true,
        tags: true,
      },
    }),
    prisma.resource.count({ where }),
  ]);

  const practiceItems = resources.map((r) => {
    let practiceType = "general";
    switch (r.category) {
      case "words":
        practiceType = "vocabulary";
        break;
      case "synonyms":
        practiceType = "synonym";
        break;
      case "grammar":
        practiceType = "grammar";
        break;
      case "reading_strategy":
        practiceType = "reading";
        break;
      case "listening_strategy":
        practiceType = "listening";
        break;
    }

    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      practiceType,
      category: r.category,
      difficulty: r.difficulty,
      preview: r.body.substring(0, 200),
      tags: r.tags,
    };
  });

  return ok({
    items: practiceItems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
