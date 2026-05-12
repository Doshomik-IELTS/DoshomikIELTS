import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }

  const profileId = current.profile.id;

  const [profile, savedResourcesCount, recentAttempts, moduleScores] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        targetBand: true,
        examDate: true,
        name: true,
        email: true,
        streak: true,
        longestStreak: true,
        lastStudyDate: true,
      },
    }),
    prisma.savedResource.count({
      where: { profileId },
    }),
    prisma.mockTestAttempt.findMany({
      where: { profileId },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        test: { select: { title: true } },
        scorePrediction: { select: { overallBand: true } },
      },
    }),
    prisma.moduleScore.findMany({
      where: {
        attempt: {
          profileId,
          status: "completed",
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        module: true,
        estimatedBand: true,
        createdAt: true,
        attemptId: true,
      },
    }),
  ]);

  const latestScoresByModule = moduleScores.reduce(
    (acc, score) => {
      if (!acc[score.module] || new Date(score.createdAt) > new Date(acc[score.module].createdAt)) {
        acc[score.module] = score;
      }
      return acc;
    },
    {} as Record<string, typeof moduleScores[0]>
  );

  const modules = ["listening", "reading", "writing", "speaking"] as const;
  const scores = modules.map((module) => ({
    module,
    band: latestScoresByModule[module]?.estimatedBand ?? null,
  }));

  const completedAttempts = recentAttempts.filter((a) => a.status === "completed").length;
  const inProgressAttempts = recentAttempts.filter((a) => a.status === "in_progress").length;

  return ok({
    profile: {
      name: profile?.name,
      email: profile?.email,
      targetBand: profile?.targetBand,
      examDate: profile?.examDate,
    },
    streak: profile?.streak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
    stats: {
      savedResources: savedResourcesCount,
      completedAttempts,
      inProgressAttempts,
    },
    scores,
    recentAttempts: recentAttempts.map((a) => ({
      id: a.id,
      testTitle: a.test?.title ?? "Unknown Test",
      status: a.status,
      startedAt: a.startedAt.toISOString(),
      completedAt: a.completedAt?.toISOString() ?? null,
      overallBand: a.scorePrediction?.overallBand ?? null,
    })),
  });
}