import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { enqueueLlmJob } from "@/lib/queue/enqueue";
import { evaluationRateLimiter, withRateLimit } from "@/lib/rate-limit";

const checkRateLimit = withRateLimit(evaluationRateLimiter, (req: Request) => {
  const userId = req.headers.get("x-user-id") ?? "unknown";
  return userId;
});

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as {
    attemptId?: string;
    sectionId?: string;
    part?: string;
    responseText?: string;
    mediaAssetId?: string;
  };
  const { attemptId, sectionId, part, responseText, mediaAssetId } = body;

  if (!attemptId || !sectionId || !part) {
    return fail({ code: "VALIDATION_ERROR", message: "Missing required fields" }, 400);
  }

  if (part !== "part_1" && part !== "part_2" && part !== "part_3") {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid part" }, 400);
  }

  const attempt = await prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  const { evaluation, job } = await prisma.$transaction(async (tx) => {
    const evaluation = await tx.speakingEvaluation.create({
      data: {
        profileId: actor.profile.id,
        attemptId,
        sectionId,
        part: part as "part_1" | "part_2" | "part_3",
        responseText: responseText || null,
        mediaAssetId: mediaAssetId || null,
        status: "queued",
      },
    });

    if (!mediaAssetId && !responseText) {
      return { evaluation, job: null };
    }

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
    await enqueueLlmJob(job.type, job.id);
  }

  return ok({
    id: evaluation.id,
    status: evaluation.status,
    createdAt: evaluation.createdAt,
  }, { status: 201 });
}
