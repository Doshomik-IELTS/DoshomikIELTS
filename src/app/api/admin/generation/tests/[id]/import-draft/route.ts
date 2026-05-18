import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const generatedQuestionSchema = z.object({
  questionType: z.string().min(1),
  prompt: z.string().min(1),
  optionsJson: z.record(z.string(), z.unknown()).optional(),
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

const generatedSectionSchema = z.object({
  module: z.enum(["listening", "reading", "writing", "speaking"]),
  title: z.string().min(1),
  partNumber: z.number().int().min(1).optional(),
  instructions: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  contentJson: z.record(z.string(), z.unknown()).optional(),
  questions: z.array(generatedQuestionSchema).optional(),
});

const generatedTestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["practice", "short_mock", "full_mock"]).optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  sections: z.array(generatedSectionSchema).min(1),
});

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const { id } = await params;
  const job = await prisma.testGenerationJob.findUnique({ where: { id } });
  if (!job) {
    return fail({ code: "NOT_FOUND", message: "Generation job not found." }, 404);
  }

  const parsed = generatedTestSchema.safeParse(job.outputJson);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Generation output is not importable.", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const test = await prisma.test.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      type: data.type ?? job.testType,
      estimatedDurationMinutes: data.estimatedDurationMinutes ?? null,
      status: "draft",
      sections: {
        create: data.sections.map((section, sectionIndex) => ({
          module: section.module,
          title: section.title,
          partNumber: section.partNumber,
          instructions: section.instructions,
          durationMinutes: section.durationMinutes,
          orderIndex: sectionIndex,
          contentJson: section.contentJson as Prisma.InputJsonValue | undefined,
          questions: {
            create: (section.questions ?? []).map((question, questionIndex) => ({
              questionType: question.questionType,
              prompt: question.prompt,
              optionsJson: question.optionsJson as Prisma.InputJsonValue | undefined,
              difficulty: question.difficulty ?? "basic",
              explanation: question.explanation,
              sourceSpanJson: question.sourceSpanJson as Prisma.InputJsonValue | undefined,
              orderIndex: questionIndex,
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
            })),
          },
        })),
      },
    },
    select: { id: true, title: true, status: true },
  });

  await prisma.testGenerationJob.update({
    where: { id },
    data: { status: "published", reviewedById: actor.profile.id },
  });

  await logAuditEvent({
    action: "generation.import_draft",
    entityType: "TestGenerationJob",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { testId: test.id, title: test.title },
  });

  return ok({ test }, { status: 201 });
}
