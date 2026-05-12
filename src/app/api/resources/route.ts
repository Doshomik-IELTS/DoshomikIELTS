import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const current = await getCurrentUser();

  const resources = await prisma.resource.findMany({
    where: {
      status: "published",
      ...(category ? { category: category as never } : {}),
      ...(difficulty ? { difficulty: difficulty as never } : {}),
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
