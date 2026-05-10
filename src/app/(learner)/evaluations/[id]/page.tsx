"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

interface EvaluationDetail {
  type: "writing" | "speaking";
  evaluation: Record<string, unknown>;
}

function getStatusBadgeVariant(status: string): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "succeeded":
      return "success";
    case "queued":
    case "processing":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export default function EvaluationPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, error, refetch } = useQuery<EvaluationDetail>({
    queryKey: ["evaluation", id],
    queryFn: () => apiFetch<EvaluationDetail>(`/api/evaluations/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state?.evaluation?.status === "queued" || state?.evaluation?.status === "processing") {
        return 5000;
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Evaluation"
          description="Loading evaluation..."
        />
        <State title="Loading..." variant="loading" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Evaluation" />
        <State
          title="Failed to load evaluation"
          variant="error"
          action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  const { type, evaluation } = data;
  const status = evaluation.status as string;
  const statusVariant = getStatusBadgeVariant(status);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Evaluation" },
        ]}
      />

      <PageHeader
        title="Evaluation Result"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
        }
      />

      {status === "queued" || status === "processing" ? (
        <State
          title={status === "queued" ? "Your evaluation is queued" : "Evaluating your response..."}
          description="This may take a few moments."
          variant="info"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant}>{status.replaceAll("_", " ")}</Badge>
            <Badge variant="neutral" className="capitalize">{type}</Badge>
          </div>

          {evaluation.overallBand !== null && evaluation.overallBand !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Band Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-6xl font-bold text-blue-700">{String(evaluation.overallBand)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-slate-500">Type</dt>
                  <dd className="mt-0.5 font-medium capitalize">{type}</dd>
                </div>
                {type === "writing" && (
                  <>
                    <div>
                      <dt className="text-sm text-slate-500">Task</dt>
                      <dd className="mt-0.5 font-medium">{(evaluation.taskType as string) || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-slate-500">Word count</dt>
                      <dd className="mt-0.5 font-medium">{(evaluation.wordCount as number) ?? "—"}</dd>
                    </div>
                  </>
                )}
                {type === "speaking" && (
                  <div>
                    <dt className="text-sm text-slate-500">Part</dt>
                    <dd className="mt-0.5 font-medium capitalize">{(evaluation.part as string) || "—"}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-slate-500">Submitted</dt>
                  <dd className="mt-0.5 text-sm">
                    {evaluation.createdAt
                      ? new Date(evaluation.createdAt as string).toLocaleString()
                      : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {type === "writing" && evaluation.responseText ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto rounded-md bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap">
                  {String(evaluation.responseText)}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {evaluation.feedbackJson ? (
            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto rounded-md bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap">
                  {JSON.stringify(evaluation.feedbackJson, null, 2)}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {status === "failed" && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Evaluation Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Something went wrong. Please try again or contact support.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
