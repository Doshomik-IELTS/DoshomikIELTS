import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const questionSchema = z.object({
  groupRef: z.string().optional(),
  questionType: z.string().min(1),
  prompt: z.string().min(1),
  optionsJson: z.record(z.string(), z.unknown()).optional(),
  orderIndex: z.number().int().min(0).optional(),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
  explanation: z.string().optional(),
  sourceSpanJson: z.record(z.string(), z.unknown()).optional(),
  answerKey: z.object({
    canonicalAnswer: z.string().min(1),
    acceptedAnswersJson: z.record(z.string(), z.unknown()).optional(),
    scoringRuleJson: z.record(z.string(), z.unknown()).optional(),
    explanation: z.string().optional(),
  }).optional(),
});

const groupSchema = z.object({
  ref: z.string().optional(),
  title: z.string().min(1),
  instructions: z.string().min(1),
  questionType: z.string().min(1),
  orderIndex: z.number().int().min(0).optional(),
  displayJson: z.record(z.string(), z.unknown()).optional(),
});

const sectionSchema = z.object({
  module: z.enum(["listening", "reading", "writing", "speaking"]),
  partNumber: z.number().int().min(1).optional(),
  title: z.string().min(1),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  orderIndex: z.number().int().min(0).optional(),
  contentJson: z.record(z.string(), z.unknown()).optional(),
  mediaAssetId: z.string().uuid().optional(),
  groups: z.array(groupSchema).optional(),
  questions: z.array(questionSchema).optional(),
});

const importSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["practice", "short_mock", "full_mock"]).optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  sections: z.array(sectionSchema).min(1),
});

export async function POST(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid import payload.", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const test = await prisma.$transaction(async (tx) => {
    const createdTest = await tx.test.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        type: data.type ?? "short_mock",
        status: "draft",
        estimatedDurationMinutes: data.estimatedDurationMinutes ?? null,
      },
      select: { id: true, title: true, type: true, status: true, createdAt: true },
    });

    for (const [sectionIndex, section] of data.sections.entries()) {
      const createdSection = await tx.testSection.create({
        data: {
          testId: createdTest.id,
          module: section.module,
          partNumber: section.partNumber,
          title: section.title,
          instructions: section.instructions,
          durationMinutes: section.durationMinutes,
          orderIndex: section.orderIndex ?? sectionIndex,
          contentJson: section.contentJson as Prisma.InputJsonValue | undefined,
          mediaAssetId: section.mediaAssetId,
        },
      });

      const groupIdByRef = new Map<string, string>();
      for (const [groupIndex, group] of (section.groups ?? []).entries()) {
        const createdGroup = await tx.questionGroup.create({
          data: {
            sectionId: createdSection.id,
            title: group.title,
            instructions: group.instructions,
            questionType: group.questionType,
            orderIndex: group.orderIndex ?? groupIndex,
            displayJson: group.displayJson as Prisma.InputJsonValue | undefined,
          },
        });
        groupIdByRef.set(group.ref ?? group.title, createdGroup.id);
      }

      for (const [questionIndex, question] of (section.questions ?? []).entries()) {
        await tx.question.create({
          data: {
            sectionId: createdSection.id,
            groupId: question.groupRef ? groupIdByRef.get(question.groupRef) : undefined,
            questionType: question.questionType,
            prompt: question.prompt,
            optionsJson: question.optionsJson as Prisma.InputJsonValue | undefined,
            orderIndex: question.orderIndex ?? questionIndex,
            difficulty: question.difficulty ?? "basic",
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

    return createdTest;
  });

  await logAuditEvent({
    action: "test.import",
    entityType: "Test",
    entityId: test.id,
    actorId: actor.profile.id,
    metadata: { title: test.title, sectionCount: data.sections.length },
  });

  return ok({ test }, { status: 201 });
}
