"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

interface Resource {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  tags: string[];
  createdAt: string;
}

interface ResourcesResponse {
  resources: Resource[];
}

async function fetchResources(): Promise<ResourcesResponse> {
  return apiFetch<ResourcesResponse>("/api/resources");
}

export function ResourceList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["resources"],
    queryFn: fetchResources,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-3 h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <State
        title="Failed to load resources"
        description="Please try again."
        variant="error"
      />
    );
  }

  if (!data?.resources?.length) {
    return (
      <State
        title="No resources found"
        variant="empty"
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data.resources.map((resource) => (
        <Link key={resource.id} href={`/resources/${resource.slug || resource.id}`}>
          <Card variant="interactive" className="h-full">
            <CardContent className="p-5">
              <p className="font-semibold text-slate-900">{resource.title}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant="neutral">{resource.category}</Badge>
                <Badge variant="neutral">{resource.difficulty}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}