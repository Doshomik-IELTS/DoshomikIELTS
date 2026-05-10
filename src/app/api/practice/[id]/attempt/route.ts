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

  const { id: resourceId } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid JSON body" }, 400);
  }

  const body = json as { answers?: Record<string, string>; timeSpentSeconds?: number };
  const { answers, timeSpentSeconds } = body;

  if (!answers) {
    return fail({ code: "VALIDATION_ERROR", message: "Answers are required" }, 400);
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId, status: "published" },
  });

  if (!resource) {
    return fail({ code: "NOT_FOUND", message: "Practice resource not found" }, 404);
  }

  const attempt = await prisma.practiceAttempt.create({
    data: {
      profileId: actor.profile.id,
      resourceId,
      practiceType: resource.category,
      answersJson: answers,
      timeSpentSeconds: timeSpentSeconds || null,
    },
  });

  return ok({
    id: attempt.id,
    practiceType: attempt.practiceType,
    createdAt: attempt.createdAt,
  }, { status: 201 });
}