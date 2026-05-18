import { ok } from "@/lib/api/response";
import { parseQuery } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchStrapiResources } from "@/lib/strapi/content";
import { z } from "zod";

const querySchema = z.object({
  category: z.enum([
    "basic_english",
    "words",
    "synonyms",
    "grammar",
    "reading_strategy",
    "listening_strategy",
    "writing_strategy",
    "speaking_strategy",
  ]).optional(),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export async function GET(request: Request) {
  const parsedQuery = parseQuery(request, querySchema);
  if (parsedQuery.response) return parsedQuery.response;
  const { category, difficulty, search } = parsedQuery.data;

  const current = await getCurrentUser();

  const strapiResources = await fetchStrapiResources({ category, difficulty, search });
  if (strapiResources) {
    return ok({
      resources: strapiResources.map((r) => ({ ...r, saved: false })),
    });
  }

  const resources = await prisma.resource.findMany({
    where: {
      status: "published",
      ...(category ? { category } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { body: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      difficulty: true,
      tags: true,
      createdAt: true,
    },
  });

  let savedIds: Set<string> = new Set();
  if (current) {
    const saved = await prisma.savedResource.findMany({
      where: { profileId: current.profile.id },
      select: { resourceId: true },
    });
    savedIds = new Set(saved.map((s) => s.resourceId));
  }

  return ok({
    resources: resources.map((r) => ({ ...r, saved: savedIds.has(r.id) })),
  });
}
