import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";

export async function GET() {
  const decks = await prisma.flashCardDeck.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { cards: true } },
    },
  });

  return ok({
    items: decks.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      category: d.category,
      difficulty: d.difficulty,
      tags: d.tags,
      cardCount: d._count.cards,
      createdAt: d.createdAt,
    })),
  });
}
