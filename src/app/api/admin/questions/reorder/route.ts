import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canEditTestContent, publishedMutationMessage } from "@/lib/tests/mutability";
import { z } from "zod";

const reorderSchema = z.object({
  sectionId: z.string().uuid(),
  questionIds: z.array(z.string().uuid()).min(1),
});

export async function PATCH(request: Request) {
  let actor;
  try {
    actor = await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

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

  const existing = await prisma.question.findMany({
    where: { sectionId: parsed.data.sectionId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((question) => question.id));
  if (parsed.data.questionIds.some((questionId) => !existingIds.has(questionId))) {
    return fail({ code: "VALIDATION_ERROR", message: "All question IDs must belong to this section." }, 400);
  }

  await prisma.$transaction(
    parsed.data.questionIds.map((questionId, index) =>
      prisma.question.update({
        where: { id: questionId },
        data: { orderIndex: index },
      }),
    ),
  );

  await logAuditEvent({
    action: "question.reorder",
    entityType: "TestSection",
    entityId: parsed.data.sectionId,
    actorId: actor.profile.id,
    metadata: { questionIds: parsed.data.questionIds },
  });

  return ok({ reordered: true });
}
