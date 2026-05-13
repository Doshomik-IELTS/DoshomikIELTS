import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { resourceId } = await params;

  const progress = await prisma.resourceProgress.findUnique({
    where: {
      profileId_resourceId: {
        profileId: actor.profile.id,
        resourceId,
      },
    },
    include: {
      resource: {
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          orderIndex: true,
        },
      },
    },
  });

  if (!progress) {
    return fail({ code: "NOT_FOUND", message: "Progress not found" }, 404);
  }

  return ok(progress);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { resourceId } = await params;
  const body = await request.json();
  const { status, progress, timeSpent } = body;

  if (status && !["not_started", "in_progress", "completed", "skipped"].includes(status)) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid status" }, 400);
  }

  if (progress !== undefined && (progress < 0 || progress > 100)) {
    return fail({ code: "VALIDATION_ERROR", message: "Progress must be 0-100" }, 400);
  }

  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });

  if (!resource) {
    return fail({ code: "NOT_FOUND", message: "Resource not found" }, 404);
  }

  const updateData: Record<string, unknown> = {};
  
  if (status) {
    updateData.status = status;
    if (status === "completed") {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }
  }
  if (progress !== undefined) {
    updateData.progress = progress;
  }
  if (timeSpent !== undefined) {
    updateData.timeSpent = timeSpent;
  }

  const result = await prisma.resourceProgress.upsert({
    where: {
      profileId_resourceId: {
        profileId: actor.profile.id,
        resourceId,
      },
    },
    create: {
      profileId: actor.profile.id,
      resourceId,
      status: status || "in_progress",
      progress: progress || 0,
      timeSpent: timeSpent || 0,
      ...(status === "completed" && { completedAt: new Date() }),
    },
    update: updateData,
  });

  return ok(result);
}