"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

interface Resource {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  body: string | null;
  examplesJson: string | null;
  tags: string[];
  publishedAt: string | null;
}

interface ResourceResponse {
  resource: Resource;
}

async function fetchResource(id: string): Promise<ResourceResponse> {
  return apiFetch<ResourceResponse>(`/api/resources/${id}`);
}

export function ResourceDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => fetchResource(id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{ success: boolean }>(`/api/resources/${id}/save`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", id, "saved"] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data?.resource) {
    return (
      <State
        title="Failed to load resource"
        variant="error"
      />
    );
  }

  const { resource } = data;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        meta={resource.category}
        title={resource.title}
        actions={
          <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        }
      />

      <div className="flex gap-2">
        <Badge variant="neutral">{resource.category}</Badge>
        <Badge variant="neutral">{resource.difficulty}</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="content-body text-slate-800 whitespace-pre-wrap">
            {resource.body || "No content available."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}