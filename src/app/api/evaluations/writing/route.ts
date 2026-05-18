import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { enqueueLlmJob } from "@/lib/queue/enqueue";
import { checkRateLimitForIdentifier, evaluationRateLimiter } from "@/lib/rate-limit";
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
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  const wordCount = responseText.split(/\s+/).filter(Boolean).length;

  const { evaluation, job } = await deps.prisma.$transaction(async (tx) => {
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

    return { evaluation: linkedEvaluation, job };
  });

  await deps.enqueueLlmJob(job.type, job.id);

  return ok({
    id: evaluation.id,
    status: evaluation.status,
    createdAt: evaluation.createdAt,
  }, { status: 201 });
}

export async function POST(request: Request) {
  return postWritingEvaluation(request);
}
