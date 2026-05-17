import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { enqueueLlmJob } from "@/lib/queue/enqueue";
import type { IeltsModule, Prisma } from "@prisma/client";

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
    include: {
      test: {
        include: {
          sections: {
            orderBy: { orderIndex: "asc" },
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
    return fail({ code: "INVALID_STATE", message: "Attempt is not in progress" }, 400);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as { sectionId?: string; responseText?: string };
  const { sectionId, responseText } = body;

  if (!sectionId) {
    return fail({ code: "VALIDATION_ERROR", message: "Section ID required" }, 400);
  }

  const section = attempt.test.sections.find((s) => s.id === sectionId);
  if (!section) {
    return fail({ code: "NOT_FOUND", message: "Section not found" }, 404);
  }

  const sectionAnswers = attempt.answers.filter((a) => a.sectionId === sectionId);
  const answeredCount = sectionAnswers.filter((a) => a.answerText || a.answerJson).length;

  if (answeredCount === 0) {
    return fail({ code: "VALIDATION_ERROR", message: "No answers provided for this section" }, 400);
  }

  let estimatedBand = 0;
  let rawScore = 0;
  let maxRawScore = 0;

  if (section.module !== "writing" && section.module !== "speaking") {
    const correctAnswers = sectionAnswers.filter((a) => a.isCorrect === true);
    rawScore = correctAnswers.length;
    
    const allQuestionsInSection = await prisma.question.count({
      where: { sectionId },
    });
    maxRawScore = allQuestionsInSection;

    if (maxRawScore > 0) {
      const percentage = (rawScore / maxRawScore) * 100;
      estimatedBand = calculateBandFromPercentage(percentage, section.module);
    }

    await prisma.moduleScore.upsert({
      where: {
        attemptId_module: {
          attemptId,
          module: section.module as IeltsModule,
        },
      },
      create: {
        attemptId,
        module: section.module as IeltsModule,
        rawScore,
        maxRawScore,
        estimatedBand,
        confidence: "medium",
      },
      update: {
        rawScore,
        maxRawScore,
        estimatedBand,
        confidence: "medium",
      },
    });
  }

  // Trigger writing evaluation when a writing section is submitted
  if (section.module === "writing" && responseText) {
    const taskType = inferTaskType(section.title, section.contentJson);
    const wordCount = responseText.split(/\s+/).filter(Boolean).length;

    const { job } = await prisma.$transaction(async (tx) => {
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

      await tx.writingEvaluation.update({
        where: { id: evaluation.id },
        data: { llmJobId: job.id },
      });

      return { evaluation, job };
    });

    await enqueueLlmJob(job.type, job.id);
  }

  await prisma.attemptAnswer.updateMany({
    where: { attemptId, sectionId },
    data: { answerJson: { isDraft: false } },
  });

  const submittedSectionIds = new Set(
    attempt.answers.filter((a) => !isDraftAnswer(a.answerJson)).map((a) => a.sectionId),
  );
  submittedSectionIds.add(sectionId);
  const totalSections = attempt.test.sections.length;
  const allSectionsCompleted = submittedSectionIds.size === totalSections;

  if (allSectionsCompleted) {
    const allModules = ["listening", "reading", "writing", "speaking"];
    const completedModules = new Set(
      attempt.test.sections.map((s) => s.module)
    );
    
    const hasAllModules = allModules.every((m) => completedModules.has(m as never));

    if (hasAllModules) {
      await prisma.mockTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: "evaluating",
          submittedAt: new Date(),
        },
      });
    }
  }

  return ok({
    attemptId,
    sectionId,
    submitted: true,
    module: section.module,
    score: section.module !== "writing" && section.module !== "speaking" 
      ? { rawScore, maxRawScore, estimatedBand }
      : null,
    allSectionsCompleted,
    status: allSectionsCompleted ? "evaluating" : "in_progress",
  });
}

function isDraftAnswer(answerJson: Prisma.JsonValue) {
  if (typeof answerJson !== "object" || answerJson === null || Array.isArray(answerJson)) {
    return false;
  }
  return (answerJson as { isDraft?: unknown }).isDraft === true;
}

function calculateBandFromPercentage(percentage: number, module: string): number {
  if (module === "listening") {
    if (percentage >= 95) return 9;
    if (percentage >= 90) return 8.5;
    if (percentage >= 85) return 8;
    if (percentage >= 80) return 7.5;
    if (percentage >= 70) return 7;
    if (percentage >= 60) return 6;
    if (percentage >= 50) return 5.5;
    if (percentage >= 40) return 5;
    if (percentage >= 30) return 4;
    if (percentage >= 20) return 3;
    return 1;
  } else if (module === "reading") {
    if (percentage >= 95) return 9;
    if (percentage >= 90) return 8.5;
    if (percentage >= 85) return 8;
    if (percentage >= 80) return 7.5;
    if (percentage >= 70) return 7;
    if (percentage >= 60) return 6;
    if (percentage >= 50) return 5.5;
    if (percentage >= 40) return 5;
    if (percentage >= 30) return 4;
    if (percentage >= 20) return 3;
    return 1;
  }
  return 0;
}

function inferTaskType(title: string | null, contentJson: Prisma.JsonValue): "task_1" | "task_2" {
  const titleLower = (title ?? "").toLowerCase();
  if (titleLower.includes("task 2") || titleLower.includes("task_2") || titleLower.includes("task2")) {
    return "task_2";
  }
  const content = contentJson as Record<string, unknown> | null;
  if (content?.taskType === "task_2") return "task_2";
  return "task_1";
}
