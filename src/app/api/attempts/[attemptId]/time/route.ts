import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const timePatchSchema = z.object({
  action: z.literal("keep-alive"),
  timeSpent: z.number().int().min(1).max(60).default(10),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { attemptId } = await params;
  const body = await request.json().catch(() => null);
  const parsedBody = timePatchSchema.safeParse(body);
  if (!parsedBody.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid timer sync payload" }, 400);
  }

  const attempt = await prisma.mockTestAttempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      profileId: true,
      status: true,
      timeSpentSeconds: true,
    },
  });

  if (!attempt || attempt.profileId !== actor.profile.id) {
    return fail({ code: "NOT_FOUND", message: "Attempt not found" }, 404);
  }

  if (attempt.status !== "in_progress") {
    return fail({ code: "INVALID_STATE", message: "Attempt is not in progress" }, 400);
  }

  const nextTimeSpentSeconds = Math.max(attempt.timeSpentSeconds, attempt.timeSpentSeconds + parsedBody.data.timeSpent);

  await prisma.mockTestAttempt.update({
    where: { id: attemptId },
    data: {
      timeSpentSeconds: nextTimeSpentSeconds,
      lastActiveAt: new Date(),
    },
  });

  return ok({
    attemptId,
    status: "synced",
    timeSpentSeconds: nextTimeSpentSeconds,
  });
}
