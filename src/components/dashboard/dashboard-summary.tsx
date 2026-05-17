"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ContentPanel } from "@/components/ui/content-panel";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { StreakBadge } from "@/components/dashboard/streak-badge";
import { AchievementsPanel, type Achievement } from "@/components/dashboard/achievements-panel";
import { ScoreTrend, ScoreTrendSkeleton } from "@/components/dashboard/score-trend";

interface DashboardData {
  profile: {
    name: string | null;
    email: string | null;
    targetBand: number | null;
    examDate: string | null;
  };
  streak: number;
  longestStreak: number;
  stats: {
    savedResources: number;
    completedAttempts: number;
    inProgressAttempts: number;
  };
  scores: { module: string; band: number | null }[];
  recentAttempts: {
    id: string;
    testTitle: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    overallBand: number | null;
  }[];
  scoreHistory: {
    date: string;
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
    overall: number | null;
  }[];
}

type AchievementsData = {
  streak: number;
  longestStreak: number;
  badges: Achievement[];
};

interface ProgressData {
  overall: {
    totalResources: number;
    completed: number;
    inProgress: number;
    percentage: number;
    totalTimeSpent: number;
  };
  byCategory: Record<string, { completed: number; total: number }>;
}

async function fetchDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>("/api/dashboard");
}

async function fetchProgress(): Promise<ProgressData> {
  return apiFetch<ProgressData>("/api/progress");
}

async function fetchAchievements(): Promise<AchievementsData> {
  return apiFetch<AchievementsData>("/api/achievements");
}

function statusVariant(status: string): "success" | "warning" | "neutral" {
  if (status === "completed") return "success";
  if (status === "in_progress") return "warning";
  return "neutral";
}

export function DashboardSummary() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: progressData } = useQuery<ProgressData>({
    queryKey: ["progress"],
    queryFn: fetchProgress,
  });

  const { data: achievementsData } = useQuery<AchievementsData>({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <State
          title="Failed to load dashboard"
          description="Please refresh the page."
          variant="error"
          action={<Button onClick={() => window.location.reload()}>Refresh</Button>}
        />
      </div>
    );
  }

  const { profile, stats, scores, recentAttempts, streak, longestStreak } = data;
  const inProgressAttempt = recentAttempts.find((attempt) => attempt.status === "in_progress");

  const examDateDisplay = profile.examDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(profile.examDate))
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={profile.name ? `Welcome back, ${profile.name}` : "Dashboard"}
        description="Track your IELTS preparation progress."
        meta={
          profile.email
            ? `${profile.email} · Target band ${profile.targetBand ?? "—"} · Exam ${examDateDisplay ?? "—"}`
            : undefined
        }
        actions={
          <Link href="/mock-tests">
            <Button>Start mock test</Button>
          </Link>
        }
      />

      <ContentPanel className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Next best action</p>
          <p className="mt-1 text-sm text-slate-600">
            {inProgressAttempt
              ? `Continue ${inProgressAttempt.testTitle}.`
              : stats.completedAttempts > 0
                ? "Start another mock test to keep your score trend current."
                : "Start with resources, then take a short mock when you are ready."}
          </p>
        </div>
        <Link href={inProgressAttempt ? `/attempts/${inProgressAttempt.id}` : stats.completedAttempts > 0 ? "/mock-tests" : "/resources"}>
          <Button variant={inProgressAttempt ? "default" : "outline"}>
            {inProgressAttempt ? "Continue attempt" : stats.completedAttempts > 0 ? "Start mock" : "Study resources"}
          </Button>
        </Link>
      </ContentPanel>

      <div className="grid gap-4 md:grid-cols-4">
        {scores.map((s) => (
          <Card key={s.module}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-600 capitalize">{s.module}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900" aria-label={`${s.module} band score: ${s.band != null ? s.band.toFixed(1) : "not available"}`}>
                {s.band == null ? "—" : s.band.toFixed(1)}
              </p>
              {s.band == null && (
                <p className="mt-1 text-xs text-slate-500">No attempt yet</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Saved resources" value={stats.savedResources} />
        <StatCard label="Completed tests" value={stats.completedAttempts} />
        <StatCard label="In progress" value={stats.inProgressAttempts} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StreakBadge streak={streak} longestStreak={longestStreak} />
        {achievementsData ? (
          <AchievementsPanel badges={achievementsData.badges} />
        ) : (
          <AchievementsPanel badges={[]} />
        )}
      </div>

      {progressData?.overall && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-slate-600">{progressData.overall.percentage}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progressData.overall.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>{progressData.overall.completed} completed</span>
                <span>{progressData.overall.inProgress} in progress</span>
              </div>
              {progressData.overall.totalTimeSpent > 0 && (
                <p className="text-xs text-slate-400">
                  Total study time: {Math.floor(progressData.overall.totalTimeSpent / 3600)}h {Math.floor((progressData.overall.totalTimeSpent % 3600) / 60)}m
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {data.scoreHistory && data.scoreHistory.length > 0 ? (
        <ScoreTrend history={data.scoreHistory} />
      ) : isLoading ? (
        <ScoreTrendSkeleton />
      ) : null}

      {recentAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {recentAttempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-900">{attempt.testTitle}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(attempt.startedAt))}
                      {" · "}
                      <Badge variant={statusVariant(attempt.status)} className="capitalize">
                        {attempt.status.replace("_", " ")}
                      </Badge>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {attempt.overallBand ? (
                      <p className="text-2xl font-bold text-slate-900">{attempt.overallBand.toFixed(1)}</p>
                    ) : attempt.status === "in_progress" ? (
                      <Link href={`/attempts/${attempt.id}`}>
                        <Button variant="outline" size="sm">Continue</Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ContentPanel>
        <p className="text-sm font-medium text-slate-700 mb-3">Next steps</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/resources">
            <Button variant="outline" size="sm">Study resources</Button>
          </Link>
          <Link href="/practice">
            <Button variant="outline" size="sm">Continue practice</Button>
          </Link>
          <Link href="/mock-tests">
            <Button variant="outline" size="sm">View mock tests</Button>
          </Link>
        </div>
      </ContentPanel>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Skeleton className="h-10 w-56" />
          <Skeleton className="mt-2 h-5 w-72" />
          <Skeleton className="mt-1 h-4 w-60" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-2 h-9 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-2 h-9 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}
