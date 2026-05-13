import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { attemptId } = await params;
  const { nextSectionId } = await request.json();

  const attempt = await prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              questions: { select: { id: true } },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  if (attempt.status !== "in_progress") {
    return fail({ code: "INVALID_STATE", message: "Test not in progress" }, 400);
  }

  const submittedSectionIds = new Set(
    attempt.answers
      .filter((a) => a.answerJson && !(a.answerJson as Record<string, unknown>)?.isDraft)
      .map((a) => a.sectionId),
  );

  const lastSubmittedSection = attempt.test.sections.find((s) => 
    submittedSectionIds.has(s.id)
  );
  
  const currentIndex = lastSubmittedSection 
    ? attempt.test.sections.findIndex((s) => s.id === lastSubmittedSection.id)
    : -1;

  const nextIndex = nextSectionId 
    ? attempt.test.sections.findIndex((s) => s.id === nextSectionId)
    : currentIndex + 1;

  if (nextIndex <= currentIndex) {
    return fail({ code: "INVALID_DIRECTION", message: "Cannot go back or same section" }, 400);
  }

  const testType = attempt.test.type;
  const isFullMock = testType === "full_mock";
  const isPractice = testType === "practice";

  if (isFullMock && nextIndex > currentIndex + 1) {
    return fail({ code: "SKIP_NOT_ALLOWED", message: "Cannot skip sections in full mock" }, 400);
  }

  const currentSection = attempt.test.sections[currentIndex];
  const nextSection = attempt.test.sections[nextIndex];

  const currentAnswers = currentSection 
    ? attempt.answers.filter((a) => a.sectionId === currentSection.id)
    : [];
  
  const answeredCount = currentAnswers.filter((a) => a.answerText || a.answerJson).length;
  const totalQuestions = currentSection?.questions.length || 0;
  const submitted = submittedSectionIds.has(currentSection?.id || "");

  const warnings: string[] = [];
  
  if (currentSection && answeredCount === 0) {
    warnings.push("no_answers");
  }
  
  if (currentSection && !submitted && !isPractice) {
    warnings.push("section_not_submitted");
  }

  return ok({
    allowed: isPractice || submitted || warnings.length === 0,
    warnings,
    currentSection: currentSection ? {
      id: currentSection.id,
      module: currentSection.module,
      answeredCount,
      totalQuestions,
      submitted,
    } : null,
    nextSection: nextSection ? {
      id: nextSection.id,
      module: nextSection.module,
      durationMinutes: nextSection.durationMinutes,
    } : null,
    canGoBack: isPractice || (isFullMock && currentIndex > 0),
  });
}