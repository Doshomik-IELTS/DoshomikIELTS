import { RESOURCE_MODULES } from "@/lib/resources/modules";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ModuleCard } from "@/components/resources/module-card";

export default function ResourcesPage() {
  return <ResourcesOverview />;
}

async function ResourcesOverview() {
  const current = await getCurrentUser();

  // Get resource counts per category (published only)
  const resourcesByCategory = await prisma.resource.groupBy({
    by: ["category"],
    where: { status: "published" },
    _count: { id: true },
  });
  const categoryCounts = Object.fromEntries(
    resourcesByCategory.map((r) => [r.category, r._count.id]),
  );

  // Get user progress per category
  const progressByCategory: Record<string, { completed: number; total: number }> = {};
  if (current) {
    const progress = await prisma.resourceProgress.findMany({
      where: { profileId: current.profile.id, status: "completed" },
      select: {
        resource: { select: { category: true } },
      },
    });

    for (const cat of Object.keys(categoryCounts)) {
      progressByCategory[cat] = {
        total: categoryCounts[cat] ?? 0,
        completed: progress.filter((p) => p.resource?.category === cat).length,
      };
    }
  }

  // Merge counts into modules
  const modulesWithCounts = RESOURCE_MODULES.map((mod) => {
    let resourceCount = 0;
    let completedCount = 0;
    for (const cat of mod.categories) {
      resourceCount += categoryCounts[cat] ?? 0;
      completedCount += progressByCategory[cat]?.completed ?? 0;
    }
    const progressPercent = resourceCount > 0 ? Math.round((completedCount / resourceCount) * 100) : 0;
    return { mod, resourceCount, completedCount, progressPercent };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
        <p className="text-sm text-slate-500">
          Study materials organized by IELTS skill. Track your progress through each module.
        </p>
      </div>

      {/* Module grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modulesWithCounts.map(({ mod, resourceCount, completedCount, progressPercent }) => (
          <ModuleCard
            key={mod.slug}
            mod={mod}
            resourceCount={resourceCount}
            completedCount={completedCount}
            progressPercent={progressPercent}
          />
        ))}
      </div>
    </div>
  );
}
