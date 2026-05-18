import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { enqueueLlmJob } from "@/lib/queue/enqueue";
import { checkRateLimitForIdentifier, evaluationRateLimiter } from "@/lib/rate-limit";
import {
  buildSectionResponseJson,
  getSectionWriteAccessError,
  getSectionMarkerId,
  getSubmittedSectionIds,
} from "@/lib/attempts/mock-test";
import { z } from "zod";

const writingEvaluationSchema = z.object({
  attemptId: z.string().trim().min(1).max(128),
  sectionId: z.string().trim().min(1).max(128),
  taskType: z.enum(["task_1", "task_2"]),
  responseText: z.string().trim().min(1).max(20_000),
});

const defaultDeps = {
  requireCurrentUser,
  checkRateLimitForIdentifier,
  evaluationRateLimiter,
  prisma,
  enqueueLlmJob,
};

type WritingEvaluationDeps = typeof defaultDeps;

export async function postWritingEvaluation(
  request: Request,
  deps: WritingEvaluationDeps = defaultDeps,
) {
  let actor;
  try {
    actor = await deps.requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const rateLimitResponse = await deps.checkRateLimitForIdentifier(
    deps.evaluationRateLimiter,
    actor.profile.id,
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const parsedBody = writingEvaluationSchema.safeParse(json);
  if (!parsedBody.success) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Invalid writing evaluation data",
      details: z.treeifyError(parsedBody.error),
    }, 400);
  }
  const { attemptId, sectionId, taskType, responseText } = parsedBody.data;

  const attempt = await deps.prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        select: {
          type: true,
          sections: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              module: true,
              durationMinutes: true,
            },
          },
        },
      },
      answers: {
        select: {
          id: true,
          sectionId: true,
          questionId: true,
          answerText: true,
          answerJson: true,
          submittedAt: true,
        },
      },
    },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  if (attempt.status !== "in_progress") {
    return fail({ code: "INVALID_STATE", message: "Attempt is not in progress" }, 400);
  }

  if (!attempt.test.sections.some((section) => section.id === sectionId && section.module === "writing")) {
    return fail({ code: "NOT_FOUND", message: "Writing section not found" }, 404);
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

  const wordCount = responseText.split(/\s+/).filter(Boolean).length;
  const submittedAt = new Date();

  let evaluation: { id: string; status: string; createdAt: Date; llmJobId: string | null };
  let job: { id: string; type: string } | null = null;

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

      const linkedEvaluation = await tx.writingEvaluation.update({
        where: { id: evaluation.id },
        data: { llmJobId: job.id },
      });

      await tx.attemptAnswer.upsert({
        where: {
          id: getSectionMarkerId(attemptId, sectionId),
        },
        create: {
          id: getSectionMarkerId(attemptId, sectionId),
          attemptId,
          sectionId,
          questionId: null,
          answerText: responseText.trim(),
          answerJson: buildSectionResponseJson({
            responseKind: "writing",
            responseText: responseText.trim(),
            isDraft: false,
          }),
          submittedAt,
        },
        update: {
          answerText: responseText.trim(),
          answerJson: buildSectionResponseJson({
            responseKind: "writing",
            responseText: responseText.trim(),
            isDraft: false,
          }),
          submittedAt,
        },
      });

      return { evaluation: linkedEvaluation, job };
    });

    evaluation = result.evaluation;
    job = result.job;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint failed") ||
        (error as { code?: string }).code === "P2002")
    ) {
      const existing = await deps.prisma.writingEvaluation.findFirst({
        where: { attemptId, sectionId },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        return ok({
          id: existing.id,
          status: existing.status,
          createdAt: existing.createdAt,
        }, { status: 200 });
      }
    }
    throw error;
  }

  if (job) {
    await deps.enqueueLlmJob(job.type, job.id);
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
    id: evaluation.id,
    status: evaluation.status,
    createdAt: evaluation.createdAt,
  }, { status: 201 });
}

export async function POST(request: Request) {
  return postWritingEvaluation(request);
}
