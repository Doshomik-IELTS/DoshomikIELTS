"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { resourceCategoryLabel } from "@/lib/resources/constants";

type ResourceProgress = {
  id: string;
  resourceId: string;
  status: "not_started" | "in_progress" | "completed" | "skipped";
  progress: number;
  timeSpent: number;
  completedAt: string | null;
  updatedAt: string;
  resource: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    orderIndex: number;
  } | null;
};

type ProgressData = {
  overall: {
    totalResources: number;
    completed: number;
    inProgress: number;
    percentage: number;
    totalTimeSpent: number;
  };
  byCategory: Record<string, { completed: number; total: number }>;
  recentProgress: ResourceProgress[];
};

function statusBadge(status: string) {
  const variants: Record<string, "success" | "warning" | "neutral" | "danger"> = {
    completed: "success",
    in_progress: "warning",
    not_started: "neutral",
    skipped: "danger",
  };
  const labels: Record<string, string> = {
    completed: "Completed",
    in_progress: "In progress",
    not_started: "Not started",
    skipped: "Skipped",
  };
  return { variant: variants[status] ?? "neutral", label: labels[status] ?? status };
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default function ProgressPage() {
  const { data, isLoading, error, refetch } = useQuery<ProgressData>({
    queryKey: ["progress"],
    queryFn: () => apiFetch<ProgressData>("/api/progress"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Progress" description="Loading..." />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Progress" />
        <State
          title="Could not load progress"
          description="Please try refreshing the page."
          variant="error"
          action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  const { overall, byCategory, recentProgress } = data;

  const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);
  const completedWithResources = recentProgress.filter((p) => p.resource && p.status === "completed");
  const inProgressWithResources = recentProgress.filter((p) => p.resource && p.status === "in_progress");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Progress"
        description="Track your learning journey across all resources."
      />

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-700" aria-label={`Overall progress: ${overall.percentage} percent`}>{overall.percentage}%</span>
                <span className="text-sm text-blue-600">
                  {overall.completed} of {overall.totalResources} resources completed
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-blue-100" role="progressbar" aria-valuenow={overall.percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Overall learning progress">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${overall.percentage}%` }}
                />
              </div>
            <div className="flex gap-6 text-sm text-blue-600">
              <span>{overall.inProgress} in progress</span>
              {overall.totalTimeSpent > 0 && (
                <span>Total study time: {formatTime(overall.totalTimeSpent)}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{overall.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-slate-500">In Progress</p>
            <p className="mt-1 text-3xl font-bold text-amber-600">{overall.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-sm text-slate-500">Total Resources</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{overall.totalResources}</p>
          </CardContent>
        </Card>
      </div>

      {categoryEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryEntries.map(([category, counts]) => {
                const pct = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{resourceCategoryLabel(category)}</span>
                      <span className="text-slate-500">{counts.completed}/{counts.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${resourceCategoryLabel(category)} progress: ${pct} percent`}>
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct > 0 ? "bg-blue-500" : "bg-slate-200"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {inProgressWithResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {inProgressWithResources.map((progress) => {
                if (!progress.resource) return null;
                const badge = statusBadge(progress.status);
                return (
                  <div key={progress.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{progress.resource.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant="neutral" className="text-xs">{resourceCategoryLabel(progress.resource.category)}</Badge>
                        <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span className="text-sm text-slate-500">{progress.progress}%</span>
                      <Link href={`/resources/${progress.resource.id}`}>
                        <Button variant="outline" size="sm">Continue</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {completedWithResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {completedWithResources.map((progress) => {
                if (!progress.resource) return null;
                return (
                  <div key={progress.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{progress.resource.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Badge variant="neutral" className="text-xs">{resourceCategoryLabel(progress.resource.category)}</Badge>
                        <Badge variant="success" className="text-xs">Completed</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {progress.timeSpent > 0 && (
                        <span className="text-sm text-slate-500">{formatTime(progress.timeSpent)}</span>
                      )}
                      <Link href={`/resources/${progress.resource.id}`}>
                        <Button variant="ghost" size="sm">Review</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {overall.totalResources === 0 && (
        <State
          title="No resources available yet"
          description="Content is being prepared. Check back soon or explore the platform."
          variant="empty"
          action={
            <Link href="/dashboard">
              <Button variant="outline">Go to Dashboard</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
