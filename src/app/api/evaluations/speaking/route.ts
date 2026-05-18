import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { enqueueLlmJob } from "@/lib/queue/enqueue";
import { checkRateLimitForIdentifier, evaluationRateLimiter } from "@/lib/rate-limit";
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

  const attempt = await deps.prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  const { evaluation, job } = await deps.prisma.$transaction(async (tx) => {
    const evaluation = await tx.speakingEvaluation.create({
      data: {
        profileId: actor.profile.id,
        attemptId,
        sectionId,
        part,
        responseText: responseText || null,
        mediaAssetId: mediaAssetId || null,
        status: "queued",
      },
    });

    const job = await tx.llmJob.create({
      data: {
        type: "speaking_evaluation",
        status: "queued",
        inputJson: {
          evaluationId: evaluation.id,
          part,
          responseText,
          mediaAssetId,
        },
      },
    });

    const linkedEvaluation = await tx.speakingEvaluation.update({
      where: { id: evaluation.id },
      data: { llmJobId: job.id },
    });

    return { evaluation: linkedEvaluation, job };
  });

  if (job) {
    await deps.enqueueLlmJob(job.type, job.id);
  }

  return ok({
    id: evaluation.id,
    status: evaluation.status,
    createdAt: evaluation.createdAt,
  }, { status: 201 });
}

export async function POST(request: Request) {
  return postSpeakingEvaluation(request);
}
