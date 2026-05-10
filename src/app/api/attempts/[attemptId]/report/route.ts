import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";

export async function GET(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { attemptId } = await params;

  const attempt = await prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: true,
      moduleScores: true,
      scorePrediction: true,
    },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  const scores = attempt.moduleScores.map((score) => ({
    module: score.module,
    rawScore: score.rawScore,
    maxRawScore: score.maxRawScore,
    estimatedBand: score.estimatedBand,
    confidence: score.confidence,
    criteriaJson: score.criteriaJson,
    feedbackJson: score.feedbackJson,
  }));

  const prediction = attempt.scorePrediction
    ? {
        listeningBand: attempt.scorePrediction.listeningBand,
        readingBand: attempt.scorePrediction.readingBand,
        writingBand: attempt.scorePrediction.writingBand,
        speakingBand: attempt.scorePrediction.speakingBand,
        overallBand: attempt.scorePrediction.overallBand,
        confidence: attempt.scorePrediction.confidence,
        disclaimer: attempt.scorePrediction.disclaimer,
      }
    : null;

  return ok({
    id: attempt.id,
    status: attempt.status,
    testTitle: attempt.test.title,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    completedAt: attempt.completedAt?.toISOString() ?? null,
    moduleScores: scores,
    scorePrediction: prediction,
  });
}