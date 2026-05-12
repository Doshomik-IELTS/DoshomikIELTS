import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const reviewSchema = z.object({
  cardId: z.string().uuid(),
  quality: z.number().int().min(0).max(5),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ deckId: string }> },
) {
  let user;
  try {
    user = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Login required" }, 401);
  }

  const { deckId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid review data" }, 400);
  }

  const { cardId, quality } = parsed.data;

  const card = await prisma.flashCard.findUnique({
    where: { id: cardId, deckId },
  });
  if (!card) {
    return fail({ code: "NOT_FOUND", message: "Card not found" }, 404);
  }

  let { interval, repetitions, easeFactor } = card;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  await prisma.flashCard.update({
    where: { id: cardId },
    data: { interval, repetitions, easeFactor, nextReview },
  });

  await prisma.cardReviewLog.create({
    data: {
      cardId,
      profileId: user.profile.id,
      quality,
      interval,
      easeFactor,
    },
  });

  const totalDue = await prisma.flashCard.count({
    where: { deckId, nextReview: { lte: new Date() } },
  });

  return ok({ interval, repetitions, easeFactor, nextReview: nextReview.toISOString(), totalDue });
}
