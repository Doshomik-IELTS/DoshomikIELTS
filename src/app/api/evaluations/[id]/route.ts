import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { id } = await params;

  const writingEvaluation = await prisma.writingEvaluation.findFirst({
    where: { id, profileId: actor.profile.id },
    include: {
      job: true,
      attempt: {
        select: { id: true, testId: true },
      },
    },
  });

  if (writingEvaluation) {
    return ok({
      type: "writing",
      id: writingEvaluation.id,
      status: writingEvaluation.status,
      taskType: writingEvaluation.taskType,
      wordCount: writingEvaluation.wordCount,
      overallBand: writingEvaluation.overallBand,
      criteriaBands: writingEvaluation.criteriaBandsJson,
      feedback: writingEvaluation.feedbackJson,
      needsHumanReview: writingEvaluation.needsHumanReview,
      createdAt: writingEvaluation.createdAt,
      updatedAt: writingEvaluation.updatedAt,
    });
  }

  const speakingEvaluation = await prisma.speakingEvaluation.findFirst({
    where: { id, profileId: actor.profile.id },
    include: {
      job: true,
      attempt: {
        select: { id: true, testId: true },
      },
      media: true,
    },
  });

  if (speakingEvaluation) {
    return ok({
      type: "speaking",
      id: speakingEvaluation.id,
      status: speakingEvaluation.status,
      part: speakingEvaluation.part,
      transcript: speakingEvaluation.transcript,
      overallBand: speakingEvaluation.overallBand,
      criteriaBands: speakingEvaluation.criteriaBandsJson,
      feedback: speakingEvaluation.feedbackJson,
      pronunciationAvailable: speakingEvaluation.pronunciationAvailable,
      needsHumanReview: speakingEvaluation.needsHumanReview,
      createdAt: speakingEvaluation.createdAt,
      updatedAt: speakingEvaluation.updatedAt,
    });
  }

  return fail({ code: "NOT_FOUND", message: "Evaluation not found" }, 404);
}