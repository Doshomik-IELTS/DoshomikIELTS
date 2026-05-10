"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { State } from "@/components/ui/state";
import { toast } from "sonner";

interface ReviewDetail {
  type: "content" | "writing" | "speaking";
  review: Record<string, unknown>;
}

export default function AdminReviewItemPage() {
  const params = useParams();
  const id = params.id as string;
  const [notes, setNotes] = useState("");
  const [band, setBand] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data, isLoading, error, refetch } = useQuery<ReviewDetail>({
    queryKey: ["admin-review", id],
    queryFn: () => apiFetch<ReviewDetail>(`/api/admin/reviews/${id}`),
    enabled: !!id,
  });

  const actionMutation = useMutation({
    mutationFn: (body: { action: string; type: string; notes?: string; band?: number; feedback?: unknown }) =>
      apiFetch<{ success: boolean }>(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      toast.success("Review updated");
      refetch();
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Review Details" description="Loading..." />
        <State title="Loading..." variant="loading" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Review Details" />
        <State
          title="Failed to load review"
          variant="error"
          action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  const { type, review } = data;
  const pending = actionMutation.isPending;

  function setReviewedBand() {
    const parsedBand = Number(band);
    if (!Number.isFinite(parsedBand)) {
      toast.error("Enter a valid band score");
      return;
    }
    actionMutation.mutate({
      type,
      action: "set_band",
      band: parsedBand,
      feedback: feedback ? { reviewerNote: feedback } : review.feedbackJson,
    });
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Reviews", href: "/admin/reviews" },
          { label: id },
        ]}
      />

      <PageHeader
        title="Review Details"
        actions={<Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>}
      />

      {type === "content" && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Content Review</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-sm text-slate-500">Content type</dt>
                  <dd className="mt-0.5 font-medium">{(review.contentType as string) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Content ID</dt>
                  <dd className="mt-0.5 font-medium text-sm">{(review.contentId as string) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-0.5 font-medium">{(review.status as string) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Notes</dt>
                  <dd className="mt-0.5 font-medium">{(review.notes as string) || "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="review-notes">Reviewer notes</Label>
                <Textarea
                  id="review-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add a short reason for the decision"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={() => actionMutation.mutate({ type, action: "approve", notes })} disabled={pending}>
                  Approve
                </Button>
                <Button variant="outline" onClick={() => actionMutation.mutate({ type, action: "reject", notes })} disabled={pending}>
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {type === "writing" && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Writing Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-sm text-slate-500">Task type</dt>
                  <dd className="mt-0.5 font-medium">{(review.taskType as string) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Word count</dt>
                  <dd className="mt-0.5 font-medium">{(review.wordCount as number) ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-0.5 font-medium">{(review.status as string) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Overall band</dt>
                  <dd className="mt-0.5 font-medium">{(review.overallBand as number) ?? "Pending"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Needs review</dt>
                  <dd className="mt-0.5 font-medium">{(review.needsHumanReview as boolean) ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {(review.responseText as string) && (
            <Card>
              <CardHeader>
                <CardTitle>Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto rounded-md bg-slate-50 p-4 text-sm whitespace-pre-wrap">
                  {review.responseText as string}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reviewer Override</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                <div>
                  <Label htmlFor="writing-band">Band override</Label>
                  <Input
                    id="writing-band"
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={band}
                    onChange={(event) => setBand(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="writing-feedback">Reviewer note</Label>
                  <Textarea
                    id="writing-feedback"
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={setReviewedBand} disabled={pending}>Save Band</Button>
                <Button
                  variant="outline"
                  onClick={() => actionMutation.mutate({ type, action: "flag_for_review" })}
                  disabled={pending}
                >
                  Flag for Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {type === "speaking" && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Speaking Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-sm text-slate-500">Part</dt>
                  <dd className="mt-0.5 font-medium capitalize">{(review.part as string) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-0.5 font-medium">{(review.status as string) || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Overall band</dt>
                  <dd className="mt-0.5 font-medium">{(review.overallBand as number) ?? "Pending"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Needs review</dt>
                  <dd className="mt-0.5 font-medium">{(review.needsHumanReview as boolean) ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {(review.transcript as string) && (
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto rounded-md bg-slate-50 p-4 text-sm whitespace-pre-wrap">
                  {review.transcript as string}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Reviewer Override</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                <div>
                  <Label htmlFor="speaking-band">Band override</Label>
                  <Input
                    id="speaking-band"
                    type="number"
                    min="0"
                    max="9"
                    step="0.5"
                    value={band}
                    onChange={(event) => setBand(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="speaking-feedback">Reviewer note</Label>
                  <Textarea
                    id="speaking-feedback"
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={setReviewedBand} disabled={pending}>Save Band</Button>
                <Button
                  variant="outline"
                  onClick={() => actionMutation.mutate({ type, action: "flag_for_review" })}
                  disabled={pending}
                >
                  Flag for Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
