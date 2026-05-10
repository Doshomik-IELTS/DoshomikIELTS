import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { id: testId } = await params;

  const test = await prisma.test.findUnique({
    where: { id: testId, status: "published" },
  });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Mock test not found" }, 404);
  }

  const existingAttempt = await prisma.mockTestAttempt.findFirst({
    where: {
      profileId: actor.profile.id,
      testId,
      status: { in: ["in_progress", "evaluating"] },
    },
  });

  if (existingAttempt) {
    return ok({
      id: existingAttempt.id,
      testId: existingAttempt.testId,
      status: existingAttempt.status,
      startedAt: existingAttempt.startedAt,
    });
  }

  const attempt = await prisma.mockTestAttempt.create({
    data: {
      profileId: actor.profile.id,
      testId,
      status: "in_progress",
    },
  });

  return ok({
    id: attempt.id,
    testId: attempt.testId,
    status: attempt.status,
    startedAt: attempt.startedAt,
  }, { status: 201 });
}