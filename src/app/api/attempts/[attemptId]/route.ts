import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";

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
      test: {
        select: {
          id: true,
          title: true,
          type: true,
          estimatedDurationMinutes: true,
          sections: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              module: true,
              partNumber: true,
              title: true,
              durationMinutes: true,
              orderIndex: true,
              instructions: true,
              contentJson: true,
              mediaAssetId: true,
              groups: {
                orderBy: { orderIndex: "asc" },
                select: {
                  id: true,
                  title: true,
                  instructions: true,
                  questionType: true,
                  orderIndex: true,
                },
              },
              questions: {
                orderBy: { orderIndex: "asc" },
                select: {
                  id: true,
                  prompt: true,
                  questionType: true,
                  optionsJson: true,
                  sourceSpanJson: true,
                  orderIndex: true,
                  groupId: true,
                },
              },
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
          isCorrect: true,
          score: true,
          submittedAt: true,
        },
      },
      moduleScores: true,
      scorePrediction: true,
    },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  const submittedSectionIds = new Set(
    attempt.answers.filter((a) => !isDraftAnswer(a.answerJson)).map((a) => a.sectionId),
  );
  const sectionsWithStatus = attempt.test.sections.map((section) => ({
    ...section,
    submitted: submittedSectionIds.has(section.id),
    answeredCount: attempt.answers.filter((a) => a.sectionId === section.id && (a.answerText || a.answerJson)).length,
    savedAnswers: Object.fromEntries(
      attempt.answers
        .filter((a) => a.sectionId === section.id && a.questionId)
        .map((a) => [a.questionId, a.answerText ?? ""]),
    ),
  }));

  const modules = ["listening", "reading", "writing", "speaking"];
  const moduleProgress = modules.map((module) => {
    const moduleSections = attempt.test.sections.filter((s) => s.module === module);
    const submitted = moduleSections.every((s) => submittedSectionIds.has(s.id));
    const score = attempt.moduleScores.find((ms) => ms.module === module);
    return {
      module,
      completed: submitted,
      band: score?.estimatedBand || null,
      rawScore: score?.rawScore || null,
      maxRawScore: score?.maxRawScore || null,
    };
  });

  const allModulesComplete = moduleProgress.every((m) => m.completed);

  return ok({
    id: attempt.id,
    testId: attempt.testId,
    testTitle: attempt.test.title,
    testType: attempt.test.type,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    completedAt: attempt.completedAt,
    sections: sectionsWithStatus,
    moduleProgress,
    allModulesComplete,
    scores: attempt.moduleScores.length > 0 ? attempt.moduleScores : null,
    prediction: attempt.scorePrediction,
  });
}

function isDraftAnswer(answerJson: Prisma.JsonValue) {
  if (typeof answerJson !== "object" || answerJson === null || Array.isArray(answerJson)) {
    return false;
  }
  return (answerJson as { isDraft?: unknown }).isDraft === true;
}
