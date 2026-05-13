import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const profile = await prisma.profile.findUnique({
    where: { id: actor.profile.id },
    include: {
      resourceProgress: {
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
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!profile) {
    return fail({ code: "NOT_FOUND", message: "Profile not found" }, 404);
  }

  const publishedResources = await prisma.resource.count({
    where: { status: "published" },
  });

  const completedResources = profile.resourceProgress.filter(
    (p) => p.status === "completed"
  ).length;

  const inProgressResources = profile.resourceProgress.filter(
    (p) => p.status === "in_progress"
  ).length;

  const totalTimeSpent = profile.resourceProgress.reduce(
    (acc, p) => acc + p.timeSpent,
    0
  );

  const progressByCategory: Record<string, { completed: number; total: number }> = {};

  const resources = await prisma.resource.findMany({
    where: { status: "published" },
    select: { id: true, category: true },
  });

  for (const resource of resources) {
    if (!progressByCategory[resource.category]) {
      progressByCategory[resource.category] = { completed: 0, total: 0 };
    }
    progressByCategory[resource.category].total += 1;
  }

  for (const progress of profile.resourceProgress) {
    if (progress.status === "completed" && progress.resource) {
      const cat = progress.resource.category;
      if (progressByCategory[cat]) {
        progressByCategory[cat].completed += 1;
      }
    }
  }

  return ok({
    overall: {
      totalResources: publishedResources,
      completed: completedResources,
      inProgress: inProgressResources,
      percentage: publishedResources > 0 
        ? Math.round((completedResources / publishedResources) * 100) 
        : 0,
      totalTimeSpent,
    },
    byCategory: progressByCategory,
    recentProgress: profile.resourceProgress.slice(0, 10),
  });
}