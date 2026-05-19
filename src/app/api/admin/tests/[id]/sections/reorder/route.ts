import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { canEditTestContent, publishedMutationMessage } from "@/lib/tests/mutability";
import { z } from "zod";

const reorderSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { id: testId } = await params;
  const editable = await canEditTestContent(testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid reorder payload.", details: parsed.error.flatten() }, 400);
  }

  const existing = await prisma.testSection.findMany({
    where: { testId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((section) => section.id));
  if (parsed.data.sectionIds.some((sectionId) => !existingIds.has(sectionId))) {
    return fail({ code: "VALIDATION_ERROR", message: "All section IDs must belong to this test." }, 400);
  }

  await prisma.$transaction(
    parsed.data.sectionIds.map((sectionId, index) =>
      prisma.testSection.update({
        where: { id: sectionId },
        data: { orderIndex: index },
      }),
    ),
  );

  await logAuditEvent({
    action: "test_section.reorder",
    entityType: "Test",
    entityId: testId,
    actorId: actor.profile.id,
    metadata: { sectionIds: parsed.data.sectionIds },
  });

  return ok({ reordered: true });
}
