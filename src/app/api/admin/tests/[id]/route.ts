import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { ok, fail } from "@/lib/api/response";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminActor();
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
            include: {
              answerKey: true,
            },
          },
        },
      },
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }

  return ok({
    id: test.id,
    title: test.title,
    type: test.type,
    status: test.status,
    estimatedDurationMinutes: test.estimatedDurationMinutes,
    publishedAt: test.publishedAt,
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
    attemptCount: test._count.attempts,
    sections: test.sections.map((section) => ({
      id: section.id,
      module: section.module,
      partNumber: section.partNumber,
      title: section.title,
      instructions: section.instructions,
      durationMinutes: section.durationMinutes,
      orderIndex: section.orderIndex,
      questionCount: section.questions.length,
      questions: section.questions.map((q) => ({
        id: q.id,
        questionType: q.questionType,
        prompt: q.prompt,
        options: q.optionsJson,
        orderIndex: q.orderIndex,
        difficulty: q.difficulty,
        answerKey: q.answerKey
          ? {
              canonicalAnswer: q.answerKey.canonicalAnswer,
              acceptedAnswers: q.answerKey.acceptedAnswersJson,
              explanation: q.answerKey.explanation,
            }
          : null,
      })),
    })),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as {
    title?: string;
    type?: string;
    status?: string;
    estimatedDurationMinutes?: number;
  };
  const { title, type, status, estimatedDurationMinutes } = body;

  const test = await prisma.test.findUnique({ where: { id } });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }

  const updateData: Record<string, unknown> = {};

  if (title !== undefined) updateData.title = title;
  if (type !== undefined) updateData.type = type;
  if (estimatedDurationMinutes !== undefined)
    updateData.estimatedDurationMinutes = estimatedDurationMinutes;

  if (status !== undefined) {
    if (status === "published" && test.status !== "published") {
      updateData.publishedAt = new Date();
    }
    updateData.status = status;
  }

  const updated = await prisma.test.update({
    where: { id },
    data: updateData,
  });

  logAuditEvent({
    action: "test.update",
    entityType: "Test",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { title: updated.title, changes: updateData },
  });

  return ok({
    id: updated.id,
    title: updated.title,
    type: updated.type,
    status: updated.status,
    estimatedDurationMinutes: updated.estimatedDurationMinutes,
    publishedAt: updated.publishedAt,
    updatedAt: updated.updatedAt,
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminActor();
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
      _count: { select: { attempts: true } },
    },
  });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }

  if (test._count.attempts > 0) {
    return fail({
      code: "INVALID_STATE",
      message: `Cannot delete test with ${test._count.attempts} attempts. Archive instead.`,
    }, 400);
  }

  const actor = await requireAdminActor();

  await prisma.test.delete({ where: { id } });

  logAuditEvent({
    action: "test.delete",
    entityType: "Test",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { title: test.title },
  });

  return ok({ deleted: true });
}