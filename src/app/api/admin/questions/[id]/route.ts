import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { ok, fail } from "@/lib/api/response";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit";
import { canEditTestContent, publishedMutationMessage } from "@/lib/tests/mutability";

const JSON_NULL = "JsonNull" as const;

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
  "writing_task_1_gt",
  "writing_task_2",
  "speaking_part1",
  "speaking_part2",
  "speaking_part3",
] as const;

const updateQuestionSchema = z.object({
  questionType: z.enum(QUESTION_TYPES).optional(),
  groupId: z.string().uuid().nullable().optional(),
  prompt: z.string().min(1).optional(),
  optionsJson: z.record(z.string(), z.unknown()).nullable().optional(),
  explanation: z.string().nullable().optional(),
  sourceSpanJson: z.record(z.string(), z.unknown()).nullable().optional(),
  answerKey: z.object({
    canonicalAnswer: z.string().min(1),
    acceptedAnswersJson: z.record(z.string(), z.unknown()).nullable().optional(),
    scoringRuleJson: z.record(z.string(), z.unknown()).nullable().optional(),
    explanation: z.string().nullable().optional(),
  }).optional(),
});

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

  const question = await prisma.question.findUnique({
    where: { id },
    include: { answerKey: true },
  });

  if (!question) {
    return fail({ code: "NOT_FOUND", message: "Question not found." }, 404);
  }

  return ok({
    id: question.id,
    sectionId: question.sectionId,
    questionType: question.questionType,
    prompt: question.prompt,
    optionsJson: question.optionsJson,
    orderIndex: question.orderIndex,
    difficulty: question.difficulty,
    explanation: question.explanation,
    sourceSpanJson: question.sourceSpanJson,
    answerKey: question.answerKey ? {
      canonicalAnswer: question.answerKey.canonicalAnswer,
      acceptedAnswersJson: question.answerKey.acceptedAnswersJson,
      scoringRuleJson: question.answerKey.scoringRuleJson,
      explanation: question.answerKey.explanation,
    } : null,
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

  const question = await prisma.question.findUnique({
    where: { id },
    include: { section: { select: { testId: true } } },
  });
  if (!question) {
    return fail({ code: "NOT_FOUND", message: "Question not found." }, 404);
  }
  const editable = await canEditTestContent(question.section.testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid question data.", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;

  if (data.answerKey) {
    const akData = {
      canonicalAnswer: data.answerKey.canonicalAnswer,
      acceptedAnswersJson: data.answerKey.acceptedAnswersJson == null
        ? { [JSON_NULL]: true }
        : data.answerKey.acceptedAnswersJson as Prisma.InputJsonValue,
      scoringRuleJson: data.answerKey.scoringRuleJson == null
        ? { [JSON_NULL]: true }
        : data.answerKey.scoringRuleJson as Prisma.InputJsonValue,
      explanation: data.answerKey.explanation ?? null,
    };
    await prisma.answerKey.upsert({
      where: { questionId: id },
      update: akData,
      create: { questionId: id, ...akData },
    });
  }

  const { answerKey: _answerKey, optionsJson: _opts, explanation: _exp, sourceSpanJson: _span, ...rest } = data;
  void _answerKey; void _opts; void _exp; void _span;
  const updateData: Prisma.QuestionUpdateInput = {
    ...rest,
    optionsJson: data.optionsJson === undefined
      ? undefined
      : (data.optionsJson === null ? { [JSON_NULL]: true } : data.optionsJson as Prisma.InputJsonValue),
    explanation: data.explanation === undefined ? undefined : data.explanation,
    sourceSpanJson: data.sourceSpanJson === undefined
      ? undefined
      : (data.sourceSpanJson === null ? { [JSON_NULL]: true } : data.sourceSpanJson as Prisma.InputJsonValue),
  };
  const updated = await prisma.question.update({
    where: { id },
    data: updateData,
    include: { answerKey: true },
  });

  await logAuditEvent({
    action: "question.update",
    entityType: "Question",
    entityId: updated.id,
    actorId: actor.profile.id,
    metadata: { sectionId: updated.sectionId, questionType: updated.questionType },
  });

  return ok({
    id: updated.id,
    groupId: updated.groupId,
    questionType: updated.questionType,
    prompt: updated.prompt,
    optionsJson: updated.optionsJson,
    orderIndex: updated.orderIndex,
    difficulty: updated.difficulty,
    explanation: updated.explanation,
    sourceSpanJson: updated.sourceSpanJson,
    answerKey: updated.answerKey ? {
      canonicalAnswer: updated.answerKey.canonicalAnswer,
      acceptedAnswersJson: updated.answerKey.acceptedAnswersJson,
      scoringRuleJson: updated.answerKey.scoringRuleJson,
      explanation: updated.answerKey.explanation,
    } : null,
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const question = await prisma.question.findUnique({
    where: { id },
    include: { section: { select: { testId: true } } },
  });
  if (!question) {
    return fail({ code: "NOT_FOUND", message: "Question not found." }, 404);
  }
  const editable = await canEditTestContent(question.section.testId);
  if (!editable.ok) {
    return fail({ code: "INVALID_STATE", message: publishedMutationMessage() }, 400);
  }

  await prisma.question.delete({ where: { id } });

  await logAuditEvent({
    action: "question.delete",
    entityType: "Question",
    entityId: id,
    actorId: actor.profile.id,
    metadata: { sectionId: question.sectionId, questionType: question.questionType },
  });

  return ok({ deleted: true });
}
