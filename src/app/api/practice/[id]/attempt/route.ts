import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { z } from "zod";

const practiceAttemptSchema = z.object({
  answers: z.record(z.string().min(1), z.string().max(10_000)).refine((value) => Object.keys(value).length > 0, {
    message: "At least one answer is required",
  }),
  timeSpentSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
});

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

  const parsedBody = practiceAttemptSchema.safeParse(json);
  if (!parsedBody.success) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Invalid practice attempt data",
      details: z.treeifyError(parsedBody.error),
    }, 400);
  }
  const { answers, timeSpentSeconds } = parsedBody.data;

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
