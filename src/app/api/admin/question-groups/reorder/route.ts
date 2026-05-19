import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canEditTestContent, publishedMutationMessage } from "@/lib/tests/mutability";
import { z } from "zod";

const reorderSchema = z.object({
  sectionId: z.string().uuid(),
  groupIds: z.array(z.string().uuid()).min(1),
});

export async function PATCH(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid reorder payload.", details: parsed.error.flatten() }, 400);
  }

  const section = await prisma.testSection.findUnique({
    where: { id: parsed.data.sectionId },
    select: { testId: true },
  });
  if (!section) {
    return fail({ code: "NOT_FOUND", message: "Section not found." }, 404);
  }
  const editable = await canEditTestContent(section.testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  const existing = await prisma.questionGroup.findMany({
    where: { sectionId: parsed.data.sectionId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((group) => group.id));
  if (parsed.data.groupIds.some((groupId) => !existingIds.has(groupId))) {
    return fail({ code: "VALIDATION_ERROR", message: "All group IDs must belong to this section." }, 400);
  }

  await prisma.$transaction(
    parsed.data.groupIds.map((groupId, index) =>
      prisma.questionGroup.update({
        where: { id: groupId },
        data: { orderIndex: index },
      }),
    ),
  );

  await logAuditEvent({
    action: "question_group.reorder",
    entityType: "TestSection",
    entityId: parsed.data.sectionId,
    actorId: actor.profile.id,
    metadata: { groupIds: parsed.data.groupIds },
  });

  return ok({ reordered: true });
}
