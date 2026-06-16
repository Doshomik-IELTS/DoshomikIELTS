import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getModuleTopics } from "@/lib/resources/topics";
import { resourceCategoryLabel } from "@/lib/resources/constants";
import type { ResourceModule } from "@/lib/resources/modules";

export async function ModuleHubPage({ mod }: { mod: ResourceModule }) {
  const current = await getCurrentUser();
  const topics = getModuleTopics(mod.slug);

  // Get resource counts per category for this module
  const categoryCounts: Record<string, number> = {};
  for (const cat of mod.categories) {
    const count = await prisma.resource.count({
      where: { status: "published", category: cat },
    });
    categoryCounts[cat] = count;
  }

  let completedCount = 0;
  const resourceCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  if (current && resourceCount > 0) {
    completedCount = await prisma.resourceProgress.count({
      where: {
        profileId: current.profile.id,
        status: "completed",
        resource: {
          category: { in: mod.categories },
          status: "published",
        },
      },
    });
  }

  const progressPercent = resourceCount > 0 ? Math.round((completedCount / resourceCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/resources" className="hover:text-blue-600 transition-colors">Resources</Link>
        <ChevronIcon />
        <span className="text-slate-900 font-medium">{mod.label}</span>
      </nav>

      {/* Module header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">{mod.label}</h1>
          <p className="text-sm text-slate-500">{mod.description}</p>
        </div>
        {resourceCount > 0 && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xs text-slate-400">Progress</p>
              <p className="text-sm font-semibold text-slate-900">{progressPercent}%</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
              <span className="text-sm font-bold text-blue-700">{completedCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {resourceCount > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      )}

      {/* Topic blocks grid */}
      {topics.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Topics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => {
              const Icon = topic.icon;
              return (
                <Link
                  key={topic.slug}
                  href={`/resources/${mod.slug}/${topic.slug}`}
                  className="group block"
                >
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {topic.label}
                    </h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {topic.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm text-slate-500">
            Topic blocks coming soon for this module.
          </p>
        </div>
      )}

      {/* Category resource lists (legacy — for modules without topics) */}
      {topics.length === 0 && resourceCount > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Resources by Category</h2>
          <div className="space-y-6">
            {mod.categories
              .filter((cat) => (categoryCounts[cat] ?? 0) > 0)
              .map((cat) => (
                <div key={cat}>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    {resourceCategoryLabel(cat)}
                    <span className="ml-1.5 text-xs text-slate-400">
                      ({categoryCounts[cat]})
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500">
                    Resources will be listed here in future updates.
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}
