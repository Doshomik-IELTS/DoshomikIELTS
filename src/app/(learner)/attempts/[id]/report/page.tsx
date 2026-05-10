"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";

type ModuleScore = {
  module: string;
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

type AttemptReport = {
  id: string;
  status: string;
  testTitle: string;
  startedAt: string;
  completedAt: string | null;
  moduleScores: ModuleScore[];
  scorePrediction: ScorePrediction | null;
};

export default function AttemptReportPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error } = useQuery<AttemptReport>({
    queryKey: ["attempt-report", id],
    queryFn: () => apiFetch<AttemptReport>(`/api/attempts/${id}/report`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Test Report"
          description="Loading your results..."
        />
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
          action={<Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>}
        />
      </div>
    );
  }

  const { moduleScores, scorePrediction } = data;

  return (
    <div className="space-y-6">
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
              <p className="text-6xl font-bold text-blue-700">{scorePrediction.overallBand}</p>
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
              <p className="text-3xl font-bold text-slate-900">{score.estimatedBand}</p>
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
                ["Listening", scorePrediction.listeningBand],
                ["Reading", scorePrediction.readingBand],
                ["Writing", scorePrediction.writingBand],
                ["Speaking", scorePrediction.speakingBand],
              ].map(([label, band]) => (
                <div key={label} className="text-center">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="text-2xl font-bold text-slate-900">{band}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
              {scorePrediction.disclaimer}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}