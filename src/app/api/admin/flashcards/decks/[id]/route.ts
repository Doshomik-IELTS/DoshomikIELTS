import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const updateDeckSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  category: z.string().optional(),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "review", "published", "archived"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { id } = await params;

  const deck = await prisma.flashCardDeck.findUnique({
    where: { id },
    include: {
      cards: { orderBy: { orderIndex: "asc" } },
    },
  });
  if (!deck) return fail({ code: "NOT_FOUND", message: "Deck not found" }, 404);

  return ok({
    id: deck.id,
    title: deck.title,
    description: deck.description,
    category: deck.category,
    difficulty: deck.difficulty,
    tags: deck.tags,
    status: deck.status,
    publishedAt: deck.publishedAt,
    createdAt: deck.createdAt,
    cards: deck.cards,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateDeckSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid data" }, 400);
  }

  const data = parsed.data;
  const updateData: Prisma.FlashCardDeckUpdateInput = { ...data };
  if (data.status === "published") {
    updateData.publishedAt = new Date();
  }

  const deck = await prisma.flashCardDeck.update({
    where: { id },
    data: updateData,
  });

  logAuditEvent({
    action: "flashcard_deck.update",
    entityType: "FlashCardDeck",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { changes: parsed.data },
  });

  return ok({ id: deck.id, title: deck.title, status: deck.status, publishedAt: deck.publishedAt });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id } = await params;
  await prisma.flashCardDeck.delete({ where: { id } });

  logAuditEvent({
    action: "flashcard_deck.delete",
    entityType: "FlashCardDeck",
    entityId: id,
    actorId: actor.profile.id,
  });

  return ok({ deleted: true });
}
