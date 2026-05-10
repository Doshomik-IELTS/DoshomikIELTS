import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { enqueueLlmJob } from "@/lib/queue/enqueue";

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
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
    taskType?: string;
    responseText?: string;
  };
  const { attemptId, sectionId, taskType, responseText } = body;

  if (!attemptId || !sectionId || !taskType || !responseText) {
    return fail({ code: "VALIDATION_ERROR", message: "Missing required fields" }, 400);
  }

  if (taskType !== "task_1" && taskType !== "task_2") {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid task type" }, 400);
  }

  const attempt = await prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  const wordCount = responseText.split(/\s+/).filter(Boolean).length;

  const { evaluation, job } = await prisma.$transaction(async (tx) => {
    const evaluation = await tx.writingEvaluation.create({
      data: {
        profileId: actor.profile.id,
        attemptId,
        sectionId,
        taskType: taskType as "task_1" | "task_2",
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

  await enqueueLlmJob(job.type, job.id);

  return ok({
    id: evaluation.id,
    status: evaluation.status,
    createdAt: evaluation.createdAt,
  }, { status: 201 });
}
