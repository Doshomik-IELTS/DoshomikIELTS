import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const createDeckSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().min(1),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).default("intermediate"),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const decks = await prisma.flashCardDeck.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { cards: true } },
      createdBy: { select: { name: true, email: true } },
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
      status: d.status,
      cardCount: d._count.cards,
      publishedAt: d.publishedAt,
      createdAt: d.createdAt,
      createdBy: d.createdBy,
    })),
  });
}

export async function POST(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const body = await request.json().catch(() => null);
  const parsed = createDeckSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid data", details: parsed.error.flatten() }, 400);
  }

  const deck = await prisma.flashCardDeck.create({
    data: parsed.data,
  });

  logAuditEvent({
    action: "flashcard_deck.create",
    entityType: "FlashCardDeck",
    entityId: deck.id,
    actorId: actor.profile.id,
    metadata: { title: deck.title, category: deck.category },
  });

  return ok({ id: deck.id, title: deck.title, category: deck.category, difficulty: deck.difficulty, status: deck.status }, { status: 201 });
}
