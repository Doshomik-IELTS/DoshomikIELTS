"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { FeedbackDisplay } from "@/components/ielts/feedback-display";
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

type EvaluationDetail = {
  id: string;
  type: "writing" | "speaking";
  status: string;
  overallBand: number | null;
  needsHumanReview: boolean;
  criteriaBands: Record<string, number> | null;
  feedback: { summary?: string; strengths?: string[]; improvements?: string[]; nextTask?: string } | null;
  taskType?: string;
  part?: string;
};

type AttemptReport = {
  id: string;
  status: string;
  testTitle: string;
  startedAt: string;
  completedAt: string | null;
  moduleScores: ModuleScore[];
  scorePrediction: ScorePrediction | null;
  evaluations: EvaluationDetail[];
};

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

export default function AttemptReportPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error, refetch } = useQuery<AttemptReport>({
    queryKey: ["attempt-report", id],
    queryFn: () => apiFetch<AttemptReport>(`/api/attempts/${id}/report`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Test Report" description="Loading your results..." />
        <State title="Loading..." variant="loading" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Test Report" />
        <State
          title="Could not load report"
          description="Please try refreshing the page."
          variant="error"
          action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  const { moduleScores, scorePrediction, evaluations } = data;
  const completedEvaluations = evaluations?.filter((e) => e.status === "succeeded" || e.status === "needs_review") ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mock Tests", href: "/mock-tests" },
          { label: data.testTitle },
          { label: "Report" },
        ]}
      />
      <PageHeader
        title={data.testTitle}
        description={
          data.completedAt
            ? `Completed ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(data.completedAt))}`
            : "In progress"
        }
      />

      {scorePrediction ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Overall Band Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className={`text-6xl font-bold ${bandColor(scorePrediction.overallBand)}`}>
                {bandIndicator(scorePrediction.overallBand)}{scorePrediction.overallBand.toFixed(1)}
              </p>
              <p className="mt-2 text-sm text-blue-600">Unofficial Estimate</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <State
          title="Complete all modules to see your score prediction"
          variant="info"
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {moduleScores.map((score) => (
          <Card key={score.module}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize">{score.module}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${bandColor(score.estimatedBand)}`}>
                {bandIndicator(score.estimatedBand)}{score.estimatedBand.toFixed(1)}
              </p>
              {score.rawScore != null && score.maxRawScore != null && (
                <p className="mt-1 text-xs text-slate-500">
                  {score.rawScore}/{score.maxRawScore} correct
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500 capitalize">
                Confidence: {score.confidence}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {scorePrediction && (
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
                <div key={label} className="text-center">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className={`text-2xl font-bold ${bandColor(band)}`}>
                    {bandIndicator(band)}{band.toFixed(1)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
              {scorePrediction.disclaimer}
            </p>
          </CardContent>
        </Card>
      )}

      {completedEvaluations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Detailed Feedback</h2>
          {completedEvaluations.map((eval_) => (
            <div key={eval_.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="neutral" className="capitalize">{eval_.type}</Badge>
                {eval_.taskType && <Badge variant="neutral">{eval_.taskType.replace("_", " ")}</Badge>}
                {eval_.part && <Badge variant="neutral" className="capitalize">{eval_.part.replace("_", " ")}</Badge>}
                {eval_.overallBand != null && (
                  <span className={`text-lg font-bold ${bandColor(eval_.overallBand)}`}>
                    Band {bandIndicator(eval_.overallBand)}{eval_.overallBand.toFixed(1)}
                  </span>
                )}
                {eval_.needsHumanReview && (
                  <Badge variant="danger">Needs Review</Badge>
                )}
              </div>
              <FeedbackDisplay
                feedback={eval_.feedback}
                criteriaBands={eval_.criteriaBands}
                overallBand={eval_.overallBand}
                type={eval_.type}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/mock-tests">
          <Button variant="outline">Back to Tests</Button>
        </Link>
        <Link href={`/attempts/${id}/score`}>
          <Button variant="ghost">View Score Summary</Button>
        </Link>
      </div>
    </div>
  );
}