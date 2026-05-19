"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { resourceCategoryLabel, difficultyLabel } from "@/lib/resources/constants";
import { ResourceSaveButton } from "@/components/resources/resource-save-button";

interface Resource {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  banglaTitle?: string | null;
  banglaSummary?: string | null;
  body: string | null;
  banglaTranslation?: string | null;
  examplesJson: unknown;
  vocabularyItemsJson?: unknown;
  tags: string[];
  publishedAt: string | null;
  saved?: boolean;
}

interface ResourceResponse {
  resource: Resource;
}

async function fetchResource(id: string): Promise<ResourceResponse> {
  return apiFetch<ResourceResponse>(`/api/resources/${id}`);
}

export function ResourceDetail({ id }: { id: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => fetchResource(id),
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
  const vocabularyItems = Array.isArray(resource.vocabularyItemsJson)
    ? resource.vocabularyItemsJson.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        meta={resourceCategoryLabel(resource.category)}
        title={resource.title}
        actions={
          <ResourceSaveButton
            resourceId={resource.id}
            initialSaved={Boolean(resource.saved)}
          />
        }
      />

      <div className="flex gap-2">
        <Badge variant="neutral">{resourceCategoryLabel(resource.category)}</Badge>
        <Badge variant="neutral">{difficultyLabel(resource.difficulty)}</Badge>
      </div>

      {(resource.banglaTitle || resource.banglaSummary) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-5">
            {resource.banglaTitle && <h2 className="text-lg font-semibold text-green-950">{resource.banglaTitle}</h2>}
            {resource.banglaSummary && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-green-900">{resource.banglaSummary}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="content-body text-slate-800 whitespace-pre-wrap">
            {resource.body || "No content available."}
          </div>
        </CardContent>
      </Card>

      {resource.banglaTranslation && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold text-slate-950">Bangla translation</h2>
            <div className="content-body whitespace-pre-wrap text-slate-800">{resource.banglaTranslation}</div>
          </CardContent>
        </Card>
      )}

      {vocabularyItems.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-950">Vocabulary</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {vocabularyItems.map((item, index) => (
                <div key={`${String(item.term ?? "item")}-${index}`} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-950">{String(item.term ?? "Untitled word")}</p>
                    {typeof item.partOfSpeech === "string" && <Badge variant="neutral">{item.partOfSpeech.replaceAll("_", " ")}</Badge>}
                    {typeof item.pronunciation === "string" && <span className="text-sm text-slate-500">{item.pronunciation}</span>}
                  </div>
                  {typeof item.banglaMeaning === "string" && <p className="mt-2 text-sm font-medium text-green-800">{item.banglaMeaning}</p>}
                  {typeof item.definition === "string" && <p className="mt-2 text-sm leading-6 text-slate-700">{item.definition}</p>}
                  {typeof item.exampleSentence === "string" && <p className="mt-2 text-sm italic text-slate-600">{item.exampleSentence}</p>}
                  {typeof item.banglaExample === "string" && <p className="mt-1 text-sm text-green-800">{item.banglaExample}</p>}
                  {typeof item.usageNote === "string" && <p className="mt-2 text-xs leading-5 text-slate-500">{item.usageNote}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
