"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery, useApiMutation } from "@/lib/hooks/api";
import { toast } from "sonner";

interface MockTestDetail {
  id: string;
  title: string;
  sections: { id: string; module: string; questionCount: number }[];
}

export default function MockTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [testId, setTestId] = useState("");
  const router = useRouter();

  params.then((p) => { if (!testId) setTestId(p.id); });

  const { data: test, isLoading } = useApiQuery<MockTestDetail>({
    queryKey: ["mock-test", testId],
    endpoint: testId ? `/api/mock-tests/${testId}` : "",
    enabled: !!testId,
  });

  const startMutation = useApiMutation({
    mutationKey: ["start-attempt"],
    endpoint: testId ? `/api/mock-tests/${testId}/start` : "",
    onSuccess: (data: { id: string }) => {
      toast.success("Test started!");
      router.push(`/attempts/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!testId || isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="space-y-6">
        <PageHeader title="Test" />
        <State
          title="Test not found"
          variant="error"
          action={<Link href="/mock-tests"><Button variant="outline">Back</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={test.title} />

      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {test.sections.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Badge variant="neutral" className="capitalize">{s.module}</Badge>
                <span className="text-sm text-slate-600">{s.questionCount} questions</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => startMutation.mutate({})} disabled={startMutation.isPending}>
          {startMutation.isPending ? "Starting..." : "Start Test"}
        </Button>
        <Link href="/mock-tests"><Button variant="outline">Cancel</Button></Link>
      </div>
    </div>
  );
}
