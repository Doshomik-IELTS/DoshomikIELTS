import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

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

  return ok({ resources });
}
