import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("includeAll") === "true";

  const deck = await prisma.flashCardDeck.findUnique({
    where: { id },
    include: {
      cards: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          front: true,
          back: true,
          examples: true,
          hints: true,
          difficulty: true,
          orderIndex: true,
          interval: true,
          repetitions: true,
          easeFactor: true,
          nextReview: true,
          createdAt: true,
        },
      },
    },
  });

  if (!deck) {
    return fail({ code: "NOT_FOUND", message: "Deck not found" }, 404);
  }

  if (deck.status !== "published" && !includeAll) {
    return fail({ code: "NOT_FOUND", message: "Deck not found" }, 404);
  }

  return ok({
    id: deck.id,
    title: deck.title,
    description: deck.description,
    category: deck.category,
    difficulty: deck.difficulty,
    tags: deck.tags,
    cards: deck.cards,
  });
}
