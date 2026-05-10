import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { resourceId } = await request.json();

  if (!resourceId) {
    return fail({ code: "VALIDATION_ERROR", message: "resourceId required" }, 400);
  }

  const prerequisites = await prisma.resourcePrerequisite.findMany({
    where: { resourceId },
    include: {
      prerequisite: {
        include: {
          progress: {
            where: { profileId: actor.profile.id },
          },
        },
      },
    },
  });

  if (prerequisites.length === 0) {
    return ok({ unlocked: true, prerequisites: [] });
  }

  const failedPrereqs: Array<{ id: string; title: string; status: string; progress: number }> = [];

  for (const prereq of prerequisites) {
    const userProgress = prereq.prerequisite.progress[0];
    const requiredProgress = prereq.minProgress || 100;
    
    const currentProgress = userProgress?.progress || 0;
    const currentStatus = userProgress?.status || "not_started";

    if (currentProgress < requiredProgress || currentStatus !== "completed") {
      failedPrereqs.push({
        id: prereq.prerequisite.id,
        title: prereq.prerequisite.title,
        status: currentStatus,
        progress: currentProgress,
      });
    }
  }

  return ok({
    unlocked: failedPrereqs.length === 0,
    prerequisites: failedPrereqs,
  });
}