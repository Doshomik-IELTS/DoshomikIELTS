import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { validateTestForPublish } from "@/lib/tests/validation";
import { createTestVersionSnapshot } from "@/lib/tests/versioning";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { answerKey: true },
          },
        },
      },
    },
  });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }

  const validation = validateTestForPublish(test);
  if (!validation.valid) {
    return fail(
      {
        code: "VALIDATION_ERROR",
        message: "Test cannot be published until validation issues are fixed.",
        details: validation,
      },
      400,
    );
  }

  await createTestVersionSnapshot({
    testId: id,
    actorId: actor.profile.id,
    changeNote: "Published test snapshot",
  });

  const updated = await prisma.test.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: test.publishedAt ?? new Date(),
    },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      description: true,
      estimatedDurationMinutes: true,
      publishedAt: true,
      versionNumber: true,
      updatedAt: true,
    },
  });

  await logAuditEvent({
    action: "test.publish",
    entityType: "Test",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { title: updated.title, type: updated.type },
  });

  return ok({ test: updated, validation });
}
