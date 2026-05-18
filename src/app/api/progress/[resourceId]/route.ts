import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const progressPatchSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "skipped"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  timeSpent: z.number().int().min(0).max(24 * 60 * 60).optional(),
});

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
  const body = await request.json().catch(() => null);
  const parsedBody = progressPatchSchema.safeParse(body);
  if (!parsedBody.success) {
    return fail({
      code: "VALIDATION_ERROR",
      message: "Invalid progress data",
      details: z.treeifyError(parsedBody.error),
    }, 400);
  }
  const { status, progress, timeSpent } = parsedBody.data;

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
