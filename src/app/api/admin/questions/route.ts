import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { ok, fail } from "@/lib/api/response";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const QUESTION_TYPES = [
  "multiple_choice_single",
  "multiple_choice_multi",
  "true_false_not_given",
  "yes_no_not_given",
  "fill_blank",
  "short_answer",
  "matching",
  "diagram_label",
  "sentence_completion",
  "summary_completion",
  "flow_chart_completion",
  "table_completion",
  "note_completion",
  "map_labeling",
  "form_completion",
  "writing_task_1",
  "writing_task_2",
  "speaking_part1",
  "speaking_part2",
  "speaking_part3",
] as const;

const createQuestionSchema = z.object({
  sectionId: z.string().uuid(),
  questionType: z.enum(QUESTION_TYPES),
  prompt: z.string().min(1),
  optionsJson: z.record(z.string(), z.unknown()).optional(),
  orderIndex: z.number().int().min(0).optional(),
  difficulty: z.enum(["basic", "intermediate", "advanced"]).optional(),
  explanation: z.string().optional(),
  answerKey: z.object({
    canonicalAnswer: z.string().min(1),
    acceptedAnswersJson: z.record(z.string(), z.unknown()).optional(),
    scoringRuleJson: z.record(z.string(), z.unknown()).optional(),
    explanation: z.string().optional(),
  }).optional(),
});

// @ts-expect-error Reserved for future PATCH endpoint
const updateQuestionSchema = createQuestionSchema.partial().omit({ sectionId: true });

export async function GET(request: Request) {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId");

  if (!sectionId) {
    return fail({ code: "VALIDATION_ERROR", message: "Missing sectionId query parameter." }, 400);
  }

  const questions = await prisma.question.findMany({
    where: { sectionId },
    orderBy: { orderIndex: "asc" },
    include: { answerKey: true },
  });

  return ok({
    questions: questions.map((q) => ({
      id: q.id,
      questionType: q.questionType,
      prompt: q.prompt,
      optionsJson: q.optionsJson,
      orderIndex: q.orderIndex,
      difficulty: q.difficulty,
      explanation: q.explanation,
      answerKey: q.answerKey ? {
        canonicalAnswer: q.answerKey.canonicalAnswer,
        acceptedAnswersJson: q.answerKey.acceptedAnswersJson,
        scoringRuleJson: q.answerKey.scoringRuleJson,
        explanation: q.answerKey.explanation,
      } : null,
    })),
  });
}

export async function POST(request: Request) {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  const body = await request.json().catch(() => null);
  const parsed = createQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid question data.", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  const section = await prisma.testSection.findUnique({ where: { id: data.sectionId } });
  if (!section) {
    return fail({ code: "NOT_FOUND", message: "Section not found." }, 404);
  }

  const maxOrder = await prisma.question.findFirst({
    where: { sectionId: data.sectionId },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });

  const question = await prisma.question.create({
    data: {
      sectionId: data.sectionId,
      questionType: data.questionType,
      prompt: data.prompt,
      optionsJson: data.optionsJson as Prisma.InputJsonValue | undefined,
      orderIndex: data.orderIndex ?? (maxOrder?.orderIndex ?? -1) + 1,
      difficulty: data.difficulty ?? "basic",
      explanation: data.explanation,
      ...(data.answerKey ? {
        answerKey: {
          create: {
            canonicalAnswer: data.answerKey.canonicalAnswer,
            acceptedAnswersJson: data.answerKey.acceptedAnswersJson as Prisma.InputJsonValue | undefined,
            scoringRuleJson: data.answerKey.scoringRuleJson as Prisma.InputJsonValue | undefined,
            explanation: data.answerKey.explanation ?? null,
          },
        },
      } : {}),
    },
    include: { answerKey: true },
  });

  return ok({
    id: question.id,
    questionType: question.questionType,
    prompt: question.prompt,
    optionsJson: question.optionsJson,
    orderIndex: question.orderIndex,
    difficulty: question.difficulty,
    explanation: question.explanation,
    answerKey: question.answerKey ? {
      canonicalAnswer: question.answerKey.canonicalAnswer,
      acceptedAnswersJson: question.answerKey.acceptedAnswersJson,
    } : null,
  }, { status: 201 });
}