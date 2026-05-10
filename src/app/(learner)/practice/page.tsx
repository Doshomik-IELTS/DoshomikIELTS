"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/lib/hooks/api";

interface PracticeItem {
  id: string;
  title: string;
  slug: string;
  practiceType: string;
  category: string;
  difficulty: string;
  preview: string;
  tags: string[];
}

interface PracticeResponse {
  items: PracticeItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const practiceTypeLabels: Record<string, string> = {
  vocabulary: "Vocabulary Quiz",
  synonym: "Synonym Matching",
  grammar: "Grammar Correction",
  reading: "Reading Practice",
  listening: "Listening Practice",
  general: "General Practice",
};

const difficultyVariant: Record<string, "success" | "warning" | "danger"> = {
  basic: "success",
  intermediate: "warning",
  advanced: "danger",
};

export default function PracticePage() {
  const { data, isLoading, error } = useApiQuery<PracticeResponse>({
    queryKey: ["practice"],
    endpoint: "/api/practice",
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Practice"
          description="Focused exercises for each IELTS skill."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Practice"
          description="Focused exercises for each IELTS skill."
        />
        <State
          title="Failed to load practice items"
          variant="error"
        />
      </div>
    );
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Practice"
          description="Focused exercises for each IELTS skill."
        />
        <State
          title="No practice items available yet"
          description="Check back later for new practice content."
          variant="empty"
        />
      </div>
    );
  }

  const grouped = items.reduce((acc, item) => {
    const type = item.practiceType || "general";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, PracticeItem[]>);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Practice"
        description="Focused exercises for each IELTS skill."
      />

      {Object.entries(grouped).map(([type, typeItems]) => (
        <div key={type} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {practiceTypeLabels[type] || "General Practice"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typeItems.map((item) => (
              <Card key={item.id} variant="interactive" className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-semibold text-slate-900 line-clamp-2">{item.title}</p>
                    <Badge variant={difficultyVariant[item.difficulty] ?? "neutral"} className="shrink-0 capitalize">
                      {item.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.preview}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {item.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="neutral" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <Link href={`/practice/${item.id}`} className="block">
                    <Button size="sm" className="w-full">Start</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
