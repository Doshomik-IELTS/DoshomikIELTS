"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";

interface Review {
  id: string;
  type: "content" | "writing" | "speaking";
  status: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

function getStatusBadgeVariant(status: string): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "published":
    case "succeeded":
      return "success";
    case "queued":
    case "processing":
      return "warning";
    case "needs_review":
      return "danger";
    default:
      return "neutral";
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "content":
      return "Content";
    case "writing":
      return "Writing";
    case "speaking":
      return "Speaking";
    default:
      return type;
  }
}

export default function AdminReviewsPage() {
  const { data, isLoading, error, refetch } = useQuery<{
    reviews: Review[];
    total: number;
    breakdown: { content: number; writing: number; speaking: number };
  }>({
    queryKey: ["admin-reviews"],
    queryFn: () =>
      apiFetch<{
        reviews: Review[];
        total: number;
        breakdown: { content: number; writing: number; speaking: number };
      }>("/api/admin/reviews"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reviews" description="Loading..." />
        <State title="Loading..." variant="loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reviews" />
        <State
          title="Failed to load reviews"
          variant="error"
          action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  const reviews = data?.reviews ?? [];
  const breakdown = data?.breakdown ?? { content: 0, writing: 0, speaking: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        actions={<Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Content Reviews</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{breakdown.content}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Writing Evaluations</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{breakdown.writing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Speaking Evaluations</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{breakdown.speaking}</p>
          </CardContent>
        </Card>
      </div>

      {reviews.length === 0 ? (
        <State title="No reviews found" variant="empty" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Details</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Updated</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => {
                  const metadata = review.metadata;
                  const profileName = (metadata.profile as { name?: string })?.name;
                  const testTitle = metadata.testTitle as string | undefined;
                  const band = metadata.overallBand as number | undefined;

                  return (
                    <tr key={review.id} className="border-b border-slate-100 last:border-0">
                      <td className="p-3">
                        <Badge variant="neutral">{getTypeLabel(review.type)}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={getStatusBadgeVariant(review.status)}>{review.status}</Badge>
                      </td>
                      <td className="p-3 text-sm text-slate-600">
                        {profileName && <p>User: {profileName}</p>}
                        {testTitle && <p>Test: {testTitle}</p>}
                        {band !== undefined && <p>Band: {band}</p>}
                        {review.type === "writing" && (
                          <p>Task: {(metadata.taskType as string) || "—"}</p>
                        )}
                        {review.type === "speaking" && (
                          <p>Part: {(metadata.part as string) || "—"}</p>
                        )}
                      </td>
                      <td className="p-3 text-sm text-slate-500">
                        {new Date(review.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Link href={`/admin/reviews/${review.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
