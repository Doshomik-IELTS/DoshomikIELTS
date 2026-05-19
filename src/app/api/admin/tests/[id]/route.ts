import { prisma } from "@/lib/prisma";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { ok, fail } from "@/lib/api/response";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const updateTestSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  type: z.enum(["practice", "short_mock", "full_mock"]).optional(),
  status: z.enum(["draft", "review", "published", "archived"]).optional(),
  estimatedDurationMinutes: z.number().int().min(1).max(600).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          groups: {
            orderBy: { orderIndex: "asc" },
          },
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
    description: test.description,
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
      contentJson: section.contentJson,
      mediaAssetId: section.mediaAssetId,
      questionCount: section.questions.length,
      groups: section.groups.map((group) => ({
        id: group.id,
        title: group.title,
        instructions: group.instructions,
        questionType: group.questionType,
        orderIndex: group.orderIndex,
        displayJson: group.displayJson,
      })),
      questions: section.questions.map((q) => ({
        id: q.id,
        groupId: q.groupId,
        questionType: q.questionType,
        prompt: q.prompt,
        options: q.optionsJson,
        orderIndex: q.orderIndex,
        difficulty: q.difficulty,
        sourceSpanJson: q.sourceSpanJson,
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
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { id } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const parsedBody = updateTestSchema.safeParse(json);
  if (!parsedBody.success) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Invalid test update data",
      details: z.treeifyError(parsedBody.error),
    }, 400);
  }
  const { title, description, type, status, estimatedDurationMinutes } = parsedBody.data;

  const test = await prisma.test.findUnique({
    where: { id },
    include: { _count: { select: { attempts: true } } },
  });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }

  const mutatesPublishedContent =
    test.status === "published" &&
    test._count.attempts > 0 &&
    (title !== undefined ||
      description !== undefined ||
      type !== undefined ||
      estimatedDurationMinutes !== undefined ||
      (status !== undefined && status !== "archived"));

  if (mutatesPublishedContent) {
    return fail(
      {
        code: "INVALID_STATE",
        message: "Published tests with learner attempts cannot be edited. Duplicate it as a draft version instead.",
      },
      400,
    );
  }

  const updateData: Record<string, unknown> = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (estimatedDurationMinutes !== undefined)
    updateData.estimatedDurationMinutes = estimatedDurationMinutes;

  if (status !== undefined) {
    if (status === "published" && test.status !== "published") {
      updateData.publishedAt = new Date();
    }
    updateData.status = status;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const testUpdate = await tx.test.update({
      where: { id },
      data: updateData,
    });

    if (status === "review") {
      const existingReview = await tx.contentReview.findFirst({
        where: { contentType: "test", contentId: id },
        select: { id: true },
      });
      if (existingReview) {
        await tx.contentReview.update({
          where: { id: existingReview.id },
          data: { status: "review", notes: "Submitted from test builder." },
        });
      } else {
        await tx.contentReview.create({
          data: {
            contentType: "test",
            contentId: id,
            status: "review",
            notes: "Submitted from test builder.",
          },
        });
      }
    }

    return testUpdate;
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
    description: updated.description,
    type: updated.type,
    status: updated.status,
    estimatedDurationMinutes: updated.estimatedDurationMinutes,
    publishedAt: updated.publishedAt,
    updatedAt: updated.updatedAt,
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

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
