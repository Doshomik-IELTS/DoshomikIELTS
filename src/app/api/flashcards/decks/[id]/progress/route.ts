import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Login required" }, 401);
  }

  const { id: deckId } = await params;

  const deck = await prisma.flashCardDeck.findUnique({
    where: { id: deckId },
    include: { _count: { select: { cards: true } } },
  });
  if (!deck) {
    return fail({ code: "NOT_FOUND", message: "Deck not found" }, 404);
  }

  const now = new Date();
  const totalCards = deck._count.cards;
  const dueToday = await prisma.flashCard.count({
    where: { deckId, nextReview: { lte: now } },
  });

  const reviewedByUser = await prisma.cardReviewLog.count({
    where: { card: { deckId }, profileId: user.profile.id },
  });

  const mastered = await prisma.flashCard.count({
    where: { deckId, repetitions: { gte: 3 } },
  });

  return ok({
    totalCards,
    dueToday,
    reviewedByUser,
    masteryPercent: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
  });
}
