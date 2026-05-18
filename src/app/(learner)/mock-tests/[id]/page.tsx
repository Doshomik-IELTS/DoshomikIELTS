"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery, useApiMutation } from "@/lib/hooks/api";
import { captureLearnerEvent } from "@/lib/analytics/posthog";
import { toast } from "sonner";

interface MockTestDetail {
  id: string;
  title: string;
  sections: { id: string; module: string; questionCount: number }[];
}

export default function MockTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = use(params);
  const [startError, setStartError] = useState<string | null>(null);
  const router = useRouter();

  const { data: test, isLoading, isError, error } = useApiQuery<MockTestDetail>({
    queryKey: ["mock-test", testId],
    endpoint: `/api/mock-tests/${testId}`,
    enabled: Boolean(testId),
  });

  const { data: credits } = useApiQuery<{ balance: number }>({
    queryKey: ["credits"],
    endpoint: "/api/credits",
  });

  const startMutation = useApiMutation({
    mutationKey: ["start-attempt"],
    endpoint: `/api/mock-tests/${testId}/start`,
    onSuccess: (data: { id: string }) => {
      setStartError(null);
      captureLearnerEvent("ielts_mock_test_started", {
        test_id: testId,
        attempt_id: data.id,
      });
      toast.success("Test started!");
      router.push(`/attempts/${data.id}`);
    },
    onError: (error: Error) => {
      setStartError(error.message);
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

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Test" />
        <State
          title="Could not load test details"
          description={error.message}
          variant="error"
          action={<Link href="/mock-tests"><Button variant="outline">Back</Button></Link>}
        />
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
          <div className="pb-4 text-sm text-slate-600">
            <p>1 credit is required to start this mock test.</p>
            {typeof credits?.balance === "number" && (
              <p className="mt-1">
                Current balance: <span className="font-semibold text-slate-900">{credits.balance}</span>{" "}
                {credits.balance === 1 ? "credit" : "credits"}.
              </p>
            )}
          </div>
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

      {startError && (
        <State
          title={credits?.balance === 0 ? "Not enough credits" : "Could not start this mock test"}
          description={credits?.balance === 0 ? "Add or earn at least 1 credit, then try again." : startError}
          variant={credits?.balance === 0 ? "info" : "error"}
          action={<Link href="/referrals"><Button variant="outline">Get Credits</Button></Link>}
        />
      )}

      <div className="flex gap-3">
        <Button onClick={() => startMutation.mutate({})} disabled={startMutation.isPending || credits?.balance === 0}>
          {startMutation.isPending ? "Starting..." : "Start Test"}
        </Button>
        <Link href="/mock-tests"><Button variant="outline">Cancel</Button></Link>
      </div>
    </div>
  );
}
