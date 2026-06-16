import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { ResourceModule } from "@/lib/resources/modules";

interface ModuleCardProps {
  mod: ResourceModule;
  resourceCount: number;
  progressPercent: number;
  completedCount: number;
}

const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-500" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", bar: "bg-emerald-500" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", bar: "bg-purple-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", bar: "bg-orange-500" },
  rose: { bg: "bg-rose-100", text: "text-rose-700", bar: "bg-rose-500" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", bar: "bg-slate-500" },
};

export function ModuleCard({ mod, resourceCount, progressPercent, completedCount }: ModuleCardProps) {
  const Icon = mod.icon;
  const colors = colorMap[mod.color] ?? colorMap.blue;

  return (
    <Link href={`/resources/${mod.slug}`} className="block group">
      <Card variant="interactive" className="h-full">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
              <Icon className="h-5 w-5" />
            </div>
            {resourceCount > 0 && (
              <span className="text-xs text-slate-400">
                {completedCount}/{resourceCount}
              </span>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              {mod.label}
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-500 line-clamp-2">
              {mod.description}
            </p>
          </div>

          {resourceCount > 0 && (
            <div className="mt-auto space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{resourceCount} resource{resourceCount !== 1 ? "s" : ""}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
