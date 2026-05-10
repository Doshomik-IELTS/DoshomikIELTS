import { prisma } from "@/lib/prisma";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { ok, fail } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    await requireAdminActor();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
    }
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as {
    sectionId: string;
    questionType: string;
    prompt: string;
    orderIndex: number;
    difficulty?: string;
    answerKey?: {
      canonicalAnswer: string;
      acceptedAnswers?: string[];
    };
  };

  const { sectionId, questionType, prompt, orderIndex, difficulty, answerKey } = body;

  if (!sectionId || !questionType || !prompt) {
    return fail({ code: "VALIDATION_ERROR", message: "sectionId, questionType, and prompt are required" }, 400);
  }

  const section = await prisma.testSection.findUnique({ where: { id: sectionId } });
  if (!section) {
    return fail({ code: "NOT_FOUND", message: "Section not found" }, 404);
  }

  const question = await prisma.question.create({
    data: {
      sectionId,
      questionType,
      prompt,
      orderIndex,
      difficulty: (difficulty as "basic" | "intermediate" | "advanced") || "basic",
    },
  });

  if (answerKey) {
    await prisma.answerKey.create({
      data: {
        questionId: question.id,
        canonicalAnswer: answerKey.canonicalAnswer,
        acceptedAnswersJson: answerKey.acceptedAnswers || undefined,
      },
    });
  }

  return ok({
    id: question.id,
    questionType: question.questionType,
    prompt: question.prompt,
    orderIndex: question.orderIndex,
  }, { status: 201 });
}