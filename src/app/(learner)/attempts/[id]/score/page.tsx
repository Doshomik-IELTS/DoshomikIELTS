"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

type ModuleScore = {
  module: string;
  rawScore: number | null;
  maxRawScore: number | null;
  estimatedBand: number;
  confidence: string;
};

type ScorePrediction = {
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  overallBand: number;
  confidence: string;
  disclaimer: string;
};

type ScoreData = {
  id: string;
  testTitle: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  moduleScores: ModuleScore[];
  scorePrediction: ScorePrediction | null;
  evaluations: {
    id: string;
    type: "writing" | "speaking";
    status: string;
    overallBand: number | null;
    needsHumanReview: boolean;
  }[];
};

function confidenceColor(confidence: string): string {
  switch (confidence) {
    case "high":
      return "text-green-600";
    case "medium":
      return "text-amber-600";
    default:
      return "text-slate-500";
  }
}

function confidenceLabel(confidence: string): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    default:
      return "Low confidence";
  }
}

function bandColor(band: number | null): string {
  if (band == null) return "text-slate-400";
  if (band >= 7) return "text-green-600";
  if (band >= 5.5) return "text-amber-600";
  return "text-red-600";
}

function bandIndicator(band: number | null): string {
  if (band == null) return "";
  if (band >= 7) return "✓ ";
  if (band >= 5.5) return "~ ";
  return "✗ ";
}

export default function ScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, error, refetch } = useQuery<ScoreData>({
    queryKey: ["attempt-score", id],
    queryFn: () => apiFetch<ScoreData>(`/api/attempts/${id}/report`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Your Score" description="Loading your results..." />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Your Score" />
        <State
          title="Could not load score"
          description="Please try refreshing the page."
          variant="error"
          action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  const { moduleScores, scorePrediction, status, evaluations } = data;

  const isEvaluating = status === "evaluating";
  const pendingEvaluations = evaluations?.filter((e) => e.status === "queued" || e.status === "processing") ?? [];
  const failedEvaluations = evaluations?.filter((e) => e.status === "failed") ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mock Tests", href: "/mock-tests" },
          { label: data.testTitle },
          { label: "Score" },
        ]}
      />
      <PageHeader
        title={data.testTitle}
        description={
          data.completedAt
            ? `Completed ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(data.completedAt))}`
            : isEvaluating
              ? "Evaluating your responses..."
              : "In progress"
        }
      />

      {isEvaluating && pendingEvaluations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base">Evaluation in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingEvaluations.map((eval_) => (
                <div key={eval_.id} className="flex items-center gap-2 text-sm text-amber-800">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  <span className="capitalize">{eval_.type} evaluation is being processed...</span>
                </div>
              ))}
              <p className="mt-2 text-xs text-amber-600">
                Your score prediction will appear here once all evaluations are complete.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {failedEvaluations.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-700">Evaluation Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedEvaluations.map((eval_) => (
                <div key={eval_.id} className="text-sm text-red-700">
                  <Badge variant="danger" className="capitalize">{eval_.type}</Badge>
                  <span className="ml-2">Evaluation failed. Please contact support.</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {scorePrediction ? (
        <>
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Overall Band Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={`text-7xl font-bold ${bandColor(scorePrediction.overallBand)}`} aria-label={`Overall band score: ${scorePrediction.overallBand.toFixed(1)} out of 9`}>
                  {bandIndicator(scorePrediction.overallBand)}{scorePrediction.overallBand.toFixed(1)}
                </p>
                <p className="mt-2 text-sm text-blue-600">Unofficial Estimate</p>
                <p className={`mt-1 text-xs ${confidenceColor(scorePrediction.confidence)}`}>
                  {confidenceLabel(scorePrediction.confidence)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            {moduleScores.map((score) => (
              <Card key={score.module}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize">{score.module}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-4xl font-bold ${bandColor(score.estimatedBand)}`} aria-label={`${score.module} band: ${score.estimatedBand.toFixed(1)}`}>
                    {bandIndicator(score.estimatedBand)}{score.estimatedBand.toFixed(1)}
                  </p>
                  {score.rawScore != null && score.maxRawScore != null && (
                    <p className="mt-1 text-xs text-slate-500">
                      {score.rawScore}/{score.maxRawScore} correct
                    </p>
                  )}
                  <p className={`mt-1 text-xs ${confidenceColor(score.confidence)}`}>
                    {confidenceLabel(score.confidence)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Listening", scorePrediction.listeningBand] as const,
                ["Reading", scorePrediction.readingBand] as const,
                ["Writing", scorePrediction.writingBand] as const,
                ["Speaking", scorePrediction.speakingBand] as const,
              ].map(([label, band]) => (
                  <div key={label as string} className="text-center">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className={`text-3xl font-bold ${bandColor(band as number)}`}>
                      {bandIndicator(band as number)}{(band as number).toFixed(1)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
                {scorePrediction.disclaimer}
              </p>
            </CardContent>
          </Card>
        </>
      ) : !isEvaluating ? (
        <State
          title="Complete all modules to see your score prediction"
          description="Submit all four sections (Listening, Reading, Writing, Speaking) to receive your score prediction."
          variant="info"
        />
      ) : null}

      <div className="flex gap-3">
        <Link href={`/attempts/${id}/report`}>
          <Button variant="outline">View Full Report</Button>
        </Link>
        <Link href="/mock-tests">
          <Button variant="ghost">Back to Tests</Button>
        </Link>
      </div>
    </div>
  );
}