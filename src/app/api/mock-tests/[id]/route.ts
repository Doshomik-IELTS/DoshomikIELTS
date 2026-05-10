import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id, status: "published" },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              questionType: true,
              prompt: true,
              optionsJson: true,
              orderIndex: true,
              difficulty: true,
            },
          },
        },
      },
    },
  });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Mock test not found" }, 404);
  }

  return ok({
    id: test.id,
    title: test.title,
    type: test.type,
    estimatedDurationMinutes: test.estimatedDurationMinutes,
    sections: test.sections.map((section) => ({
      id: section.id,
      module: section.module,
      partNumber: section.partNumber,
      title: section.title,
      instructions: section.instructions,
      durationMinutes: section.durationMinutes,
      orderIndex: section.orderIndex,
      questionCount: section.questions.length,
      questions: section.questions.map((q) => ({
        id: q.id,
        questionType: q.questionType,
        prompt: q.prompt,
        options: q.optionsJson,
        orderIndex: q.orderIndex,
        difficulty: q.difficulty,
      })),
    })),
  });
}