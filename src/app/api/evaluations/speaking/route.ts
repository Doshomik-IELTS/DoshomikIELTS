import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import {
  buildSectionResponseJson,
  getSectionWriteAccessError,
  getSectionMarkerId,
  getSubmittedSectionIds,
} from "@/lib/attempts/mock-test";
import { enqueueLlmJob } from "@/lib/queue/enqueue";
import { checkRateLimitForIdentifier, evaluationRateLimiter } from "@/lib/rate-limit";
import { verifyCsrf } from "@/lib/security/csrf";
import { z } from "zod";

const speakingEvaluationSchema = z.object({
  attemptId: z.string().trim().min(1).max(128),
  sectionId: z.string().trim().min(1).max(128),
  part: z.enum(["part_1", "part_2", "part_3"]),
  responseText: z.string().trim().min(1).max(20_000).optional(),
  mediaAssetId: z.string().trim().min(1).max(128).optional(),
}).refine((value) => value.responseText || value.mediaAssetId, {
  message: "responseText or mediaAssetId is required",
});

const defaultDeps = {
  requireCurrentUser,
  checkRateLimitForIdentifier,
  evaluationRateLimiter,
  prisma,
  enqueueLlmJob,
};

type SpeakingEvaluationDeps = typeof defaultDeps;

export async function postSpeakingEvaluation(
  request: Request,
  deps: SpeakingEvaluationDeps = defaultDeps,
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

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const parsedBody = speakingEvaluationSchema.safeParse(json);
  if (!parsedBody.success) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Invalid speaking evaluation data",
      details: z.treeifyError(parsedBody.error),
    }, 400);
  }
  const { attemptId, sectionId, part, responseText, mediaAssetId } = parsedBody.data;
  const normalizedResponseText = responseText?.trim() || null;

  const mediaAsset = mediaAssetId
    ? await deps.prisma.mediaAsset.findUnique({
        where: { id: mediaAssetId },
        select: {
          id: true,
          profileId: true,
          transcriptText: true,
        },
      })
    : null;

  if (mediaAssetId && (!mediaAsset || mediaAsset.profileId !== actor.profile.id)) {
    return fail({ code: "NOT_FOUND", message: "Recording not found" }, 404);
  }

  const normalizedTranscript = mediaAsset?.transcriptText?.trim() || null;
  const readyForAutomatedEvaluation = Boolean(normalizedResponseText || normalizedTranscript);

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

  if (!attempt.test.sections.some((section) => section.id === sectionId && section.module === "speaking")) {
    return fail({ code: "NOT_FOUND", message: "Speaking section not found" }, 404);
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

  let evaluation: { id: string; status: string; createdAt: Date; llmJobId: string | null };
  let job: { id: string; type: string } | null = null;

  try {
    const result = await deps.prisma.$transaction(async (tx) => {
      const evaluation = await tx.speakingEvaluation.create({
        data: {
          profileId: actor.profile.id,
          attemptId,
          sectionId,
          part,
          responseText: normalizedResponseText,
          mediaAssetId: mediaAssetId || null,
          transcript: normalizedTranscript,
          status: readyForAutomatedEvaluation ? "queued" : "needs_review",
          needsHumanReview: !readyForAutomatedEvaluation,
        },
      });

      let job: { id: string; type: string } | null = null;
      let linkedEvaluation = evaluation;

      if (readyForAutomatedEvaluation) {
        job = await tx.llmJob.create({
          data: {
            type: "speaking_evaluation",
            status: "queued",
            inputJson: {
              evaluationId: evaluation.id,
              part,
              responseText: normalizedResponseText,
              transcript: normalizedTranscript,
              mediaAssetId,
            },
          },
        });

        linkedEvaluation = await tx.speakingEvaluation.update({
          where: { id: evaluation.id },
          data: { llmJobId: job.id },
        });
      }

      await tx.attemptAnswer.upsert({
        where: {
          id: getSectionMarkerId(attemptId, sectionId),
        },
        create: {
          id: getSectionMarkerId(attemptId, sectionId),
          attemptId,
          sectionId,
          questionId: null,
          answerText: normalizedResponseText,
          answerJson: buildSectionResponseJson({
            responseKind: "speaking",
            responseText: normalizedResponseText,
            mediaAssetId: mediaAssetId || null,
            isDraft: false,
          }),
          submittedAt,
        },
        update: {
          answerText: normalizedResponseText,
          answerJson: buildSectionResponseJson({
            responseKind: "speaking",
            responseText: normalizedResponseText,
            mediaAssetId: mediaAssetId || null,
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
      const existing = await deps.prisma.speakingEvaluation.findFirst({
        where: { attemptId, sectionId, part },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        return ok({
          id: existing.id,
          status: existing.status,
          createdAt: existing.createdAt,
          sectionSubmitted: true,
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
  const allSectionsCompleted = submittedSectionIds.size === attempt.test.sections.length;

  if (allSectionsCompleted) {
    await deps.prisma.mockTestAttempt.update({
      where: { id: attemptId },
      data: {
        status: "evaluating",
        submittedAt,
      },
    });
  }

  return ok({
    id: evaluation.id,
    status: evaluation.status,
    createdAt: evaluation.createdAt,
    sectionSubmitted: true,
  }, { status: 201 });
}

export async function POST(request: Request) {
  return postSpeakingEvaluation(request);
}
