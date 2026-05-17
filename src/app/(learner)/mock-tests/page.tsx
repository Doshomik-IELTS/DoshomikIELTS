"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/lib/hooks/api";
import { moduleLabel } from "@/lib/resources/constants";
import { testTypeLabel } from "@/lib/tests/constants";

interface MockTest {
  id: string;
  title: string;
  type: string;
  modules: string[];
  sections: number;
}

export default function MockTestsPage() {
  const { data, isLoading } = useApiQuery<{ items: MockTest[] }>({
    queryKey: ["mock-tests"],
    endpoint: "/api/mock-tests",
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mock Tests"
          description="Complete all four modules to unlock score prediction."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-3 h-4 w-1/2" />
                <Skeleton className="mt-1 h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const items = data?.items || [];

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mock Tests"
          description="Complete all four modules to unlock score prediction."
        />
        <State
          title="No tests available yet"
          variant="empty"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Tests"
        description="Complete all four modules to unlock score prediction."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((test) => (
          <Card key={test.id} variant="interactive" className="h-full">
            <CardContent className="p-5">
              <p className="text-lg font-semibold text-slate-900">{test.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="info">{testTypeLabel(test.type)}</Badge>
                {test.modules.map((m) => (
                  <Badge key={m} variant="neutral">{moduleLabel(m)}</Badge>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-500">{test.sections} sections</p>
              <Link href={`/mock-tests/${test.id}`} className="mt-4 block">
                <Button className="w-full">Start Test</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
