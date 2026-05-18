import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const updateCardSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  examples: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
  orderIndex: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { id } = await params;
  const card = await prisma.flashCard.findUnique({ where: { id } });
  if (!card) return fail({ code: "NOT_FOUND", message: "Card not found" }, 404);
  return ok(card);
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
  const parsed = updateCardSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid data" }, 400);
  }

  const card = await prisma.flashCard.update({
    where: { id },
    data: parsed.data,
  });

  logAuditEvent({
    action: "flashcard_card.update",
    entityType: "FlashCard",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { changes: parsed.data },
  });

  return ok(card);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id } = await params;
  await prisma.flashCard.delete({ where: { id } });

  logAuditEvent({
    action: "flashcard_card.delete",
    entityType: "FlashCard",
    entityId: id,
    actorId: actor.profile.id,
  });

  return ok({ deleted: true });
}
