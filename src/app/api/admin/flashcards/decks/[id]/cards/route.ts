import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const createCardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  examples: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([]),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).default("intermediate"),
  orderIndex: z.number().int().min(0).optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const { id: deckId } = await params;

  const cards = await prisma.flashCard.findMany({
    where: { deckId },
    orderBy: { orderIndex: "asc" },
  });

  return ok({ cards });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const { id: deckId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = createCardSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid data", details: parsed.error.flatten() }, 400);
  }

  const maxOrder = await prisma.flashCard.findFirst({
    where: { deckId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  const card = await prisma.flashCard.create({
    data: {
      deckId,
      front: parsed.data.front,
      back: parsed.data.back,
      examples: parsed.data.examples,
      hints: parsed.data.hints,
      difficulty: parsed.data.difficulty,
      orderIndex: parsed.data.orderIndex ?? (maxOrder?.orderIndex ?? -1) + 1,
      tags: parsed.data.tags,
    },
  });

  logAuditEvent({
    action: "flashcard_card.create",
    entityType: "FlashCard",
    entityId: card.id,
    actorId: actor.profile.id,
    metadata: { deckId },
  });

  return ok({ id: card.id, front: card.front, orderIndex: card.orderIndex }, { status: 201 });
}
