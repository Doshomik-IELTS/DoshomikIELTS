import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(_request);
  if (csrfResponse) return csrfResponse;

  const { id } = await params;
  const source = await prisma.test.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          groups: { orderBy: { orderIndex: "asc" } },
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { answerKey: true },
          },
        },
      },
    },
  });

  if (!source) {
    return fail({ code: "NOT_FOUND", message: "Test not found" }, 404);
  }

  const created = await prisma.$transaction(async (tx) => {
    const test = await tx.test.create({
      data: {
        title: `${source.title} (Draft v${source.versionNumber + 1})`,
        description: source.description,
        type: source.type,
        status: "draft",
        estimatedDurationMinutes: source.estimatedDurationMinutes,
        versionNumber: source.versionNumber + 1,
        parentTestId: source.id,
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        estimatedDurationMinutes: true,
        versionNumber: true,
        parentTestId: true,
        createdAt: true,
      },
    });

    for (const section of source.sections) {
      const createdSection = await tx.testSection.create({
        data: {
          testId: test.id,
          module: section.module,
          partNumber: section.partNumber,
          title: section.title,
          instructions: section.instructions,
          durationMinutes: section.durationMinutes,
          orderIndex: section.orderIndex,
          contentJson: section.contentJson as Prisma.InputJsonValue | undefined,
          mediaAssetId: section.mediaAssetId,
        },
      });

      const groupIdBySourceId = new Map<string, string>();
      for (const group of section.groups) {
        const createdGroup = await tx.questionGroup.create({
          data: {
            sectionId: createdSection.id,
            title: group.title,
            instructions: group.instructions,
            questionType: group.questionType,
            orderIndex: group.orderIndex,
            displayJson: group.displayJson as Prisma.InputJsonValue | undefined,
          },
        });
        groupIdBySourceId.set(group.id, createdGroup.id);
      }

      for (const question of section.questions) {
        await tx.question.create({
          data: {
            sectionId: createdSection.id,
            groupId: question.groupId ? groupIdBySourceId.get(question.groupId) : undefined,
            questionType: question.questionType,
            prompt: question.prompt,
            optionsJson: question.optionsJson as Prisma.InputJsonValue | undefined,
            orderIndex: question.orderIndex,
            difficulty: question.difficulty,
            explanation: question.explanation,
            sourceSpanJson: question.sourceSpanJson as Prisma.InputJsonValue | undefined,
            ...(question.answerKey
              ? {
                  answerKey: {
                    create: {
                      canonicalAnswer: question.answerKey.canonicalAnswer,
                      acceptedAnswersJson: question.answerKey.acceptedAnswersJson as Prisma.InputJsonValue | undefined,
                      scoringRuleJson: question.answerKey.scoringRuleJson as Prisma.InputJsonValue | undefined,
                      explanation: question.answerKey.explanation,
                    },
                  },
                }
              : {}),
          },
        });
      }
    }

    return test;
  });

  await logAuditEvent({
    action: "test.duplicate",
    entityType: "Test",
    entityId: created.id,
    actorId: actor.profile.id,
    metadata: { sourceTestId: source.id, sourceTitle: source.title, title: created.title },
  });

  return ok({ test: created }, { status: 201 });
}
