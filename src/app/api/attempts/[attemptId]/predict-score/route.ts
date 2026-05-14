import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { predictionRateLimiter, withRateLimit } from "@/lib/rate-limit";

const checkRateLimit = withRateLimit(predictionRateLimiter, (req: Request) => {
  const userId = req.headers.get("x-user-id") ?? "unknown";
  return userId;
});

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
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

  const { attemptId } = await params;

  const attempt = await prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: { select: { module: true } },
        },
      },
      moduleScores: true,
    },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  const modules = new Set(attempt.test.sections.map((s) => s.module));
  const allModulesComplete = ["listening", "reading", "writing", "speaking"].every(
    (m) => modules.has(m as never)
  );

  if (!allModulesComplete) {
    return fail({
      code: "INVALID_STATE",
      message: "All four modules must be completed before score prediction",
    }, 400);
  }

  const listeningScore = attempt.moduleScores.find((ms) => ms.module === "listening");
  const readingScore = attempt.moduleScores.find((ms) => ms.module === "reading");
  const writingScore = attempt.moduleScores.find((ms) => ms.module === "writing");
  const speakingScore = attempt.moduleScores.find((ms) => ms.module === "speaking");

  if (!listeningScore || !readingScore || !writingScore || !speakingScore) {
    return fail({
      code: "INVALID_STATE",
      message: "All module scores must be available",
    }, 400);
  }

  const overallBand = (
    listeningScore.estimatedBand +
    readingScore.estimatedBand +
    writingScore.estimatedBand +
    speakingScore.estimatedBand
  ) / 4;

  const roundedOverall = Math.round(overallBand * 2) / 2;

  let confidence: "low" | "medium" | "high" = "medium";
  if (listeningScore.confidence === "high" && readingScore.confidence === "high") {
    confidence = "high";
  }

  const prediction = await prisma.scorePrediction.upsert({
    where: { attemptId },
    create: {
      attemptId,
      listeningBand: listeningScore.estimatedBand,
      readingBand: readingScore.estimatedBand,
      writingBand: writingScore.estimatedBand,
      speakingBand: speakingScore.estimatedBand,
      overallBand: roundedOverall,
      confidence,
      disclaimer: "This is an unofficial estimate based on your performance. Official IELTS scores may differ.",
    },
    update: {
      listeningBand: listeningScore.estimatedBand,
      readingBand: readingScore.estimatedBand,
      writingBand: writingScore.estimatedBand,
      speakingBand: speakingScore.estimatedBand,
      overallBand: roundedOverall,
      confidence,
      disclaimer: "This is an unofficial estimate based on your performance. Official IELTS scores may differ.",
    },
  });

  await prisma.mockTestAttempt.update({
    where: { id: attemptId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  return ok({
    listeningBand: prediction.listeningBand,
    readingBand: prediction.readingBand,
    writingBand: prediction.writingBand,
    speakingBand: prediction.speakingBand,
    overallBand: prediction.overallBand,
    confidence: prediction.confidence,
    label: "unofficial estimate",
    disclaimer: prediction.disclaimer,
  });
}