import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { attemptId } = await params;

  const attempt = await prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  if (attempt.status !== "in_progress") {
    return fail({ code: "INVALID_STATE", message: "Attempt is not in progress" }, 400);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as { sectionId?: string; answers?: Record<string, string>; isDraft?: boolean };
  const { sectionId, answers, isDraft = false } = body;

  if (!sectionId || !answers) {
    return fail({ code: "VALIDATION_ERROR", message: "Section ID and answers required" }, 400);
  }

  const section = await prisma.testSection.findUnique({
    where: { id: sectionId },
    include: {
      questions: {
        include: { answerKey: true },
      },
    },
  });

  if (!section || section.testId !== attempt.testId) {
    return fail({ code: "NOT_FOUND", message: "Section not found" }, 404);
  }

  let correctCount = 0;
  let totalQuestions = 0;

  if (section.questions && section.questions.length > 0) {
    for (const question of section.questions) {
      const userAnswer = answers[question.id];
      if (userAnswer !== undefined && userAnswer !== null && userAnswer !== "") {
        totalQuestions++;
        const isCorrect = scoreObjectiveAnswer(userAnswer, question.answerKey);
        
        if (isCorrect) correctCount++;

        await prisma.attemptAnswer.upsert({
          where: {
            id: `${attemptId}-${sectionId}-${question.id}`,
          },
          create: {
            id: `${attemptId}-${sectionId}-${question.id}`,
            attemptId,
            sectionId,
            questionId: question.id,
            answerText: userAnswer,
            answerJson: { value: userAnswer, isDraft },
            isCorrect,
            score: isCorrect !== null ? (isCorrect ? 1 : 0) : null,
          },
          update: {
            answerText: userAnswer,
            answerJson: { value: userAnswer, isDraft },
            isCorrect,
            score: isCorrect !== null ? (isCorrect ? 1 : 0) : null,
          },
        });
      }
    }
  }

  return ok({
    attemptId,
    sectionId,
    isDraft,
    savedAnswers: Object.keys(answers).length,
    autoScored: totalQuestions > 0 ? { correct: correctCount, total: totalQuestions } : null,
  });
}

function scoreObjectiveAnswer(
  userAnswer: string,
  answerKey: {
    canonicalAnswer: string;
    acceptedAnswersJson: unknown;
    scoringRuleJson: unknown;
  } | null,
) {
  if (!answerKey?.canonicalAnswer) return null;

  const rule = isRecord(answerKey.scoringRuleJson) ? answerKey.scoringRuleJson : {};
  const answers = [
    answerKey.canonicalAnswer,
    ...Object.values(isRecord(answerKey.acceptedAnswersJson) ? answerKey.acceptedAnswersJson : {}).map(String),
  ];
  const maxWords = typeof rule.maxWords === "number" ? rule.maxWords : null;
  if (maxWords && wordCount(userAnswer) > maxWords) return false;

  return answers.some((answer) => normalizeAnswer(userAnswer, rule) === normalizeAnswer(answer, rule));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeAnswer(value: string, rule: Record<string, unknown>) {
  let normalized = value.trim();
  if (rule.ignorePunctuation !== false) {
    normalized = normalized.replace(/[^\w\s]/g, "");
  }
  normalized = normalized.replace(/\s+/g, " ");
  if (rule.caseSensitive !== true) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
