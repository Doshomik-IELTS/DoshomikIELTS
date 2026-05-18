import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { verifyCsrf } from "@/lib/security/csrf";
import {
  buildAnswerJson,
  buildSectionResponseJson,
  getSectionWriteAccessError,
  getSectionMarkerId,
  getSectionResponseKey,
  getSubmittedSectionIds,
} from "@/lib/attempts/mock-test";
import { enqueueLlmJob } from "@/lib/queue/enqueue";
import type { IeltsModule, Prisma } from "@prisma/client";
import { z } from "zod";

const submitSectionSchema = z.object({
  sectionId: z.string().trim().min(1).max(128),
  responseText: z.string().trim().min(1).max(20_000).optional(),
});

const defaultDeps = {
  requireCurrentUser,
  prisma,
  enqueueLlmJob,
};

type SubmitSectionDeps = typeof defaultDeps;

export async function postSubmitSection(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
  deps: SubmitSectionDeps = defaultDeps,
) {
  let actor;
  try {
    actor = await deps.requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { attemptId } = await params;

  const attempt = await deps.prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  if (attempt.status !== "in_progress") {
    return fail({ code: "INVALID_STATE", message: "Attempt is not in progress" }, 400);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const parsedBody = submitSectionSchema.safeParse(json);
  if (!parsedBody.success) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Invalid section submission data",
      details: z.treeifyError(parsedBody.error),
    }, 400);
  }
  const { sectionId, responseText } = parsedBody.data;

  const section = attempt.test.sections.find((s) => s.id === sectionId);
  if (!section) {
    return fail({ code: "NOT_FOUND", message: "Section not found" }, 404);
  }

  const writeAccessError = getSectionWriteAccessError({
    attemptStartedAt: attempt.startedAt,
    testType: attempt.test.type,
    sections: attempt.test.sections,
    answers: attempt.answers,
    sectionId,
  });
  if (writeAccessError) {
    return fail(writeAccessError, writeAccessError.code === "TIME_EXPIRED" ? 409 : 400);
  }

  const submittedAt = new Date();
  const sectionAnswers = attempt.answers.filter((a) => a.sectionId === sectionId);
  const sectionResponseKey = getSectionResponseKey(section.module);
  const hasSectionResponse =
    Boolean(responseText?.trim()) || sectionAnswers.some((answer) => answer.answerText || answer.answerJson);
  const answeredCount = sectionAnswers.filter((a) => a.answerText || a.answerJson).length;

  if (answeredCount === 0 && !hasSectionResponse) {
    return fail({ code: "VALIDATION_ERROR", message: "No answers provided for this section" }, 400);
  }

  let estimatedBand = 0;
  let rawScore = 0;
  let maxRawScore = 0;

  if (section.module !== "writing" && section.module !== "speaking") {
    const correctAnswers = sectionAnswers.filter((a) => a.isCorrect === true);
    rawScore = correctAnswers.length;
    
    const allQuestionsInSection = await deps.prisma.question.count({
      where: { sectionId },
    });
    maxRawScore = allQuestionsInSection;

    if (maxRawScore > 0) {
      const percentage = (rawScore / maxRawScore) * 100;
      estimatedBand = await calculateBandFromScoreMapping(section.module, rawScore, maxRawScore, percentage);
    }

    await deps.prisma.moduleScore.upsert({
      where: {
        attemptId_module: {
          attemptId,
          module: section.module as IeltsModule,
        },
      },
      create: {
        attemptId,
        module: section.module as IeltsModule,
        rawScore,
        maxRawScore,
        estimatedBand,
        confidence: "medium",
      },
      update: {
        rawScore,
        maxRawScore,
        estimatedBand,
        confidence: "medium",
      },
    });
  }

  // Trigger writing evaluation when a writing section is submitted
  if (section.module === "writing" && responseText) {
    const taskType = inferTaskType(section.title, section.contentJson);
    const wordCount = responseText.split(/\s+/).filter(Boolean).length;

    let job: { type: string; id: string } | null = null;

    try {
      const result = await deps.prisma.$transaction(async (tx) => {
        const evaluation = await tx.writingEvaluation.create({
          data: {
            profileId: actor.profile.id,
            attemptId,
            sectionId,
            taskType,
            responseText,
            wordCount,
            status: "queued",
          },
        });

        const job = await tx.llmJob.create({
          data: {
            type: "writing_evaluation",
            status: "queued",
            inputJson: {
              evaluationId: evaluation.id,
              taskType,
              responseText,
              wordCount,
            },
          },
        });

        await tx.writingEvaluation.update({
          where: { id: evaluation.id },
          data: { llmJobId: job.id },
        });

        return { evaluation, job };
      });

      job = result.job;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint failed") ||
          (error as { code?: string }).code === "P2002")
      ) {
        // Idempotent: existing evaluation found, skip creating a duplicate job
        job = null;
      } else {
        throw error;
      }
    }

    if (job) {
      await deps.enqueueLlmJob(job.type, job.id);
    }
  }

  // Batch update all answers in a single transaction to avoid N+1 queries
  if (sectionAnswers.length > 0) {
    await deps.prisma.$transaction(
      sectionAnswers.map((answer) =>
        deps.prisma.attemptAnswer.update({
          where: { id: answer.id },
          data: {
            answerJson: buildAnswerJson(answer.answerJson, { isDraft: false }),
            submittedAt,
          },
        }),
      ),
    );
  }

  if (sectionResponseKey) {
    await deps.prisma.attemptAnswer.upsert({
      where: {
        id: getSectionMarkerId(attemptId, sectionId),
      },
      create: {
        id: getSectionMarkerId(attemptId, sectionId),
        attemptId,
        sectionId,
        questionId: null,
        answerText: responseText?.trim() || null,
        answerJson: buildSectionResponseJson({
          responseKind: sectionResponseKey,
          responseText: responseText?.trim() || null,
          isDraft: false,
        }),
        submittedAt,
      },
      update: {
        answerText: responseText?.trim() || null,
        answerJson: buildSectionResponseJson({
          responseKind: sectionResponseKey,
          responseText: responseText?.trim() || null,
          isDraft: false,
        }),
        submittedAt,
      },
    });
  }

  const submittedSectionIds = getSubmittedSectionIds(attempt.answers);
  submittedSectionIds.add(sectionId);
  const totalSections = attempt.test.sections.length;
  const allSectionsCompleted = submittedSectionIds.size === totalSections;

  if (allSectionsCompleted) {
    const requiresEvaluation = attempt.test.sections.some(
      (attemptSection) => attemptSection.module === "writing" || attemptSection.module === "speaking",
    );
    const nextStatus = requiresEvaluation ? "evaluating" : "completed";

    await deps.prisma.mockTestAttempt.update({
      where: { id: attemptId },
      data: {
        status: nextStatus,
        submittedAt,
        completedAt: nextStatus === "completed" ? submittedAt : null,
      },
    });
  }

  return ok({
    attemptId,
    sectionId,
    submitted: true,
    module: section.module,
    score: section.module !== "writing" && section.module !== "speaking" 
      ? { rawScore, maxRawScore, estimatedBand }
      : null,
    allSectionsCompleted,
    status: allSectionsCompleted
      ? attempt.test.sections.some((attemptSection) => attemptSection.module === "writing" || attemptSection.module === "speaking")
        ? "evaluating"
        : "completed"
      : "in_progress",
  });
}

export async function POST(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  return postSubmitSection(request, context);
}

async function calculateBandFromScoreMapping(
  module: string,
  rawScore: number,
  maxRawScore: number,
  fallbackPercentage: number,
): Promise<number> {
  const mapping = await prisma.scoreMapping.findFirst({
    where: {
      module: module === "reading" ? "reading_academic" : module,
      isDefault: true,
    },
  });

  if (mapping?.rawToBandJson) {
    const bands = mapping.rawToBandJson as Array<{ minRaw: number; maxRaw: number; band: number }>;
    for (const entry of bands) {
      if (rawScore >= entry.minRaw && rawScore <= entry.maxRaw) {
        return entry.band;
      }
    }
  }

  return calculateBandFromPercentage(fallbackPercentage, module);
}

function calculateBandFromPercentage(percentage: number, module: string): number {
  if (module === "listening") {
    if (percentage >= 95) return 9;
    if (percentage >= 90) return 8.5;
    if (percentage >= 85) return 8;
    if (percentage >= 80) return 7.5;
    if (percentage >= 70) return 7;
    if (percentage >= 60) return 6;
    if (percentage >= 50) return 5.5;
    if (percentage >= 40) return 5;
    if (percentage >= 30) return 4;
    if (percentage >= 20) return 3;
    return 1;
  } else if (module === "reading") {
    if (percentage >= 95) return 9;
    if (percentage >= 90) return 8.5;
    if (percentage >= 85) return 8;
    if (percentage >= 80) return 7.5;
    if (percentage >= 70) return 7;
    if (percentage >= 60) return 6;
    if (percentage >= 50) return 5.5;
    if (percentage >= 40) return 5;
    if (percentage >= 30) return 4;
    if (percentage >= 20) return 3;
    return 1;
  }
  return 0;
}

function inferTaskType(title: string | null, contentJson: Prisma.JsonValue): "task_1" | "task_2" {
  const titleLower = (title ?? "").toLowerCase();
  if (titleLower.includes("task 2") || titleLower.includes("task_2") || titleLower.includes("task2")) {
    return "task_2";
  }
  const content = contentJson as Record<string, unknown> | null;
  if (content?.taskType === "task_2") return "task_2";
  return "task_1";
}
