import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { canEditTestContent, publishedMutationMessage } from "@/lib/tests/mutability";

const groupPatchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  instructions: z.string().min(1).max(2000).optional(),
  questionType: z.string().min(1).max(120).optional(),
  orderIndex: z.number().int().min(0).optional(),
  displayJson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = groupPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid question group data.", details: parsed.error.flatten() }, 400);
  }

  const existing = await prisma.questionGroup.findUnique({
    where: { id },
    include: { section: { select: { testId: true } } },
  });
  if (!existing) {
    return fail({ code: "NOT_FOUND", message: "Question group not found." }, 404);
  }
  const editable = await canEditTestContent(existing.section.testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  const group = await prisma.questionGroup.update({
    where: { id },
    data: {
      ...parsed.data,
      displayJson: parsed.data.displayJson === undefined
        ? undefined
        : parsed.data.displayJson === null
          ? Prisma.JsonNull
          : parsed.data.displayJson as Prisma.InputJsonValue,
    },
  });

  await logAuditEvent({
    action: "question_group.update",
    entityType: "QuestionGroup",
    entityId: group.id,
    actorId: actor.profile.id,
    metadata: { sectionId: group.sectionId, title: group.title },
  });

  return ok({ group });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id } = await params;
  const group = await prisma.questionGroup.findUnique({
    where: { id },
    include: { section: { select: { testId: true } } },
  });
  if (!group) {
    return fail({ code: "NOT_FOUND", message: "Question group not found." }, 404);
  }
  const editable = await canEditTestContent(group.section.testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  await prisma.questionGroup.delete({ where: { id } });
  await logAuditEvent({
    action: "question_group.delete",
    entityType: "QuestionGroup",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { sectionId: group.sectionId, title: group.title },
  });

  return ok({ deleted: true });
}
