"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery, useApiMutation } from "@/lib/hooks/api";
import { toast } from "sonner";

interface PracticeResource {
  id: string;
  title: string;
  body: string;
}

export default function PracticeAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  params.then((p) => { if (!id) setId(p.id); });

  const { data: resource, isLoading } = useApiQuery<PracticeResource>({
    queryKey: ["resource", id],
    endpoint: id ? `/api/resources/${id}` : "",
    enabled: !!id,
  });

  const submitMutation = useApiMutation({
    mutationKey: ["practice-attempt"],
    endpoint: id ? `/api/practice/${id}/attempt` : "",
    onSuccess: (data: unknown) => {
      setResult(data);
      setSubmitted(true);
      toast.success("Practice completed!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!id || isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!resource && !submitted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Practice" />
        <State
          title="Resource not found"
          variant="error"
          action={<Link href="/practice"><Button variant="outline">Back</Button></Link>}
        />
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Practice Result" />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">Completed!</p>
            <div className="mt-4 flex gap-3 justify-center">
              <Link href="/practice"><Button>Back to Practice</Button></Link>
              <Button variant="outline" onClick={() => { setSubmitted(false); setResult(null); setAnswers({}); }}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={resource?.title ?? "Practice"} />

      <Card>
        <CardContent className="p-6">
          <div className="content-body text-slate-800 whitespace-pre-wrap">
            {resource?.body}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="answer">Your Answer</Label>
        <Input
          id="answer"
          placeholder="Type your answer..."
          value={answers["main"] || ""}
          onChange={(e) => setAnswers({ ...answers, main: e.target.value })}
        />
      </div>

      <Button
        onClick={() => submitMutation.mutate({ answers, timeSpentSeconds: 60 })}
        disabled={submitMutation.isPending || !answers["main"]}
      >
        {submitMutation.isPending ? "Submitting..." : "Submit"}
      </Button>
    </div>
  );
}
