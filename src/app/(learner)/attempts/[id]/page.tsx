"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ContentPanel } from "@/components/ui/content-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery, useApiMutation } from "@/lib/hooks/api";
import { toast } from "sonner";
import { SpeakingSubmission } from "@/components/ielts/speaking-submission";

interface AttemptDetail {
  id: string;
  testTitle: string;
  status: string;
  sections: {
    id: string;
    module: string;
    title: string;
    submitted: boolean;
    savedAnswers: Record<string, string>;
    questions: { id: string; prompt: string }[];
  }[];
  moduleProgress: { module: string; completed: boolean; band: number | null }[];
  prediction: { overallBand: number } | null;
  allModulesComplete: boolean;
}

type AnswerState = Record<string, Record<string, string>>;

export default function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: attemptId } = use(params);

  const { data: attempt, isLoading, refetch } = useApiQuery<AttemptDetail>({
    queryKey: ["attempt", attemptId],
    endpoint: `/api/attempts/${attemptId}`,
    enabled: Boolean(attemptId),
    refetchInterval: 3000,
  });

  const predictMutation = useApiMutation<unknown, Record<string, never>>({
    mutationKey: ["predict"],
    endpoint: `/api/attempts/${attemptId}/predict-score`,
    onSuccess: (data) => {
      const prediction = data as { overallBand?: number };
      toast.success(`Score: ${prediction.overallBand ?? "ready"}`);
      refetch();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attempt not found" />
        <Link href="/mock-tests"><Button>Back</Button></Link>
      </div>
    );
  }

  if (attempt.status === "completed" || attempt.status === "evaluating") {
    return (
      <div className="space-y-6">
        <PageHeader title={attempt.testTitle} meta={`Status: ${attempt.status}`} />

        {attempt.prediction && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Predicted Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-700">{attempt.prediction.overallBand}</p>
                <p className="mt-2 text-sm text-blue-600">Unofficial estimate</p>
              </div>
            </CardContent>
          </Card>
        )}

        {attempt.allModulesComplete && !attempt.prediction && attempt.status === "completed" && (
          <Button onClick={() => predictMutation.mutate({})} disabled={predictMutation.isPending}>
            {predictMutation.isPending ? "Calculating..." : "Get Predicted Score"}
          </Button>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          {attempt.moduleProgress.map((mp) => (
            <Card key={mp.module}>
              <CardContent className="p-5 text-center">
                <p className="text-sm font-medium text-slate-600 capitalize">{mp.module}</p>
                <p className={`mt-1 text-lg font-semibold ${mp.completed ? "text-green-600" : "text-slate-500"}`}>
                  {mp.completed ? "Complete" : "In progress"}
                </p>
                {mp.band && <p className="mt-2 text-3xl font-bold text-slate-900">{mp.band}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Link href="/mock-tests"><Button variant="outline">Back to Tests</Button></Link>
          <Link href={`/attempts/${attemptId}/report`}><Button variant="ghost">View Report</Button></Link>
        </div>
      </div>
    );
  }

  return <ActiveAttempt attempt={attempt} onRefresh={refetch} />;
}

function ActiveAttempt({ attempt, onRefresh }: { attempt: AttemptDetail; onRefresh: () => void }) {
  const [currentSection, setCurrentSection] = useState(0);
  const draftStorageKey = `ieltspp:attempt:${attempt.id}:draft`;
  const [answers, setAnswers] = useState<AnswerState>(() => getInitialAnswers(attempt, draftStorageKey));
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(() => JSON.stringify(answers));

  const saveMutation = useApiMutation<unknown, { sectionId: string; answers: Record<string, string>; isDraft: boolean }>({
    mutationKey: ["save-answers"],
    endpoint: `/api/attempts/${attempt.id}/answers`,
    onSuccess: () => {
      toast.success("Saved");
      setLastSavedSnapshot(JSON.stringify(answers));
      window.localStorage.removeItem(draftStorageKey);
      onRefresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitMutation = useApiMutation<unknown, { sectionId: string }>({
    mutationKey: ["submit-section"],
    endpoint: `/api/attempts/${attempt.id}/submit-section`,
    onSuccess: () => {
      toast.success("Submitted!");
      setLastSavedSnapshot(JSON.stringify(answers));
      window.localStorage.removeItem(draftStorageKey);
      onRefresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const currentSnapshot = useMemo(() => JSON.stringify(answers), [answers]);
  const hasUnsavedChanges = currentSnapshot !== lastSavedSnapshot;

  useEffect(() => {
    if (hasUnsavedChanges) {
      window.localStorage.setItem(draftStorageKey, currentSnapshot);
    }
  }, [currentSnapshot, draftStorageKey, hasUnsavedChanges]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const section = attempt.sections[currentSection];
  const sectionAnswers = answers[section?.id] || {};
  const sectionHasAnswers = Object.values(sectionAnswers).some((value) => value.trim().length > 0);

  async function saveDraft() {
    if (!section) return;
    await saveMutation.mutateAsync({ sectionId: section.id, answers: sectionAnswers, isDraft: true });
  }

  async function submitSection() {
    if (!section) return;
    await saveMutation.mutateAsync({ sectionId: section.id, answers: sectionAnswers, isDraft: false });
    await submitMutation.mutateAsync({ sectionId: section.id });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium">{attempt.testTitle}</p>
          <h1 className="text-2xl font-bold text-slate-900">
            Section {currentSection + 1} of {attempt.sections.length}
          </h1>
          {hasUnsavedChanges && (
            <p className="mt-1 text-sm text-amber-600">Unsaved changes</p>
          )}
        </div>
        <Link
          href="/mock-tests"
          onClick={(event) => {
            if (hasUnsavedChanges && !window.confirm("You have unsaved answers. Leave this attempt?")) {
              event.preventDefault();
            }
          }}
        >
          <Button variant="ghost" size="sm">Exit</Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {attempt.sections.map((s, index) => (
          <Button
            key={s.id}
            variant={index === currentSection ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentSection(index)}
          >
            <span className="capitalize">{s.module}</span>
            {s.submitted && <span className="ml-1 text-green-300">✓</span>}
          </Button>
        ))}
      </div>

      {section && (
        <>
          <ContentPanel>
            <p className="font-semibold text-slate-900 capitalize">{section.title || section.module}</p>
            {section.submitted && (
              <p className="mt-1 text-sm text-slate-500">This section is submitted and locked.</p>
            )}
          </ContentPanel>

          <div className="space-y-4">
            {section.module === "speaking" ? (
              <Card>
                <CardContent className="p-5">
                  <SpeakingSubmission
                    attemptId={attempt.id}
                    sectionId={section.id}
                    part={section.title?.toLowerCase().includes("part 2") ? "part_2" : "part_1"}
                    onSubmitted={() => {
                      toast.success("Speaking response submitted!");
                      onRefresh();
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              section.questions.map((question, index) => (
                <Card key={question.id}>
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-slate-500 mb-2">Question {index + 1}</p>
                    <p className="text-slate-700 mb-4">{question.prompt}</p>
                    <Input
                      placeholder="Type your answer..."
                      value={sectionAnswers[question.id] || ""}
                      disabled={section.submitted}
                      onChange={(event) =>
                        setAnswers({
                          ...answers,
                          [section.id]: { ...sectionAnswers, [question.id]: event.target.value },
                        })
                      }
                    />
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex gap-3 pb-4">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={saveMutation.isPending || section.submitted || !sectionHasAnswers}
            >
              {saveMutation.isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={submitSection}
              disabled={
                saveMutation.isPending || submitMutation.isPending || section.submitted || !sectionHasAnswers
              }
            >
              {saveMutation.isPending || submitMutation.isPending ? "Submitting..." : "Submit Section"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function getInitialAnswers(attempt: AttemptDetail, draftStorageKey: string) {
  const savedAnswers = Object.fromEntries(
    attempt.sections.map((section) => [section.id, section.savedAnswers ?? {}]),
  );

  try {
    const localDraft = window.localStorage.getItem(draftStorageKey);
    return localDraft ? (JSON.parse(localDraft) as AnswerState) : savedAnswers;
  } catch {
    return savedAnswers;
  }
}
