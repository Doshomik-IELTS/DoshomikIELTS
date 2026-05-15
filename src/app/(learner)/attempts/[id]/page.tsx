"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ContentPanel } from "@/components/ui/content-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery, useApiMutation } from "@/lib/hooks/api";
import { toast } from "sonner";
import { SpeakingSubmission } from "@/components/ielts/speaking-submission";
import { TestTimer } from "@/components/ielts/test-timer";
import { WritingEditor } from "@/components/ielts/writing-editor";
import { IeltsSectionRenderer } from "@/components/ielts/ielts-section-renderer";

interface AttemptDetail {
  id: string;
  testTitle: string;
  status: string;
  sections: {
    id: string;
    module: string;
    title: string;
    submitted: boolean;
    durationMinutes: number | null;
    savedAnswers: Record<string, string>;
    instructions: string | null;
    contentJson: Record<string, unknown> | null;
    mediaAssetId: string | null;
    groups: { id: string; title: string; instructions: string; questionType: string; orderIndex: number }[];
    questions: { id: string; groupId: string | null; prompt: string; questionType: string; optionsJson: Record<string, unknown> | null; sourceSpanJson?: Record<string, unknown> | null }[];
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
  const [reviewing, setReviewing] = useState(false);

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
    setReviewing(false);
  }, [currentSection]);

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
  const unansweredQuestions = section?.questions.filter((question) => !sectionAnswers[question.id]?.trim()) ?? [];

  async function saveDraft() {
    if (!section) return;
    await saveMutation.mutateAsync({ sectionId: section.id, answers: sectionAnswers, isDraft: true });
  }

  async function submitSection() {
    if (!section) return;
    if (!reviewing) {
      setReviewing(true);
      if (unansweredQuestions.length > 0) {
        toast.warning(`${unansweredQuestions.length} question${unansweredQuestions.length === 1 ? "" : "s"} unanswered. Review before submitting.`);
      }
      return;
    }
    await saveMutation.mutateAsync({ sectionId: section.id, answers: sectionAnswers, isDraft: false });
    await submitMutation.mutateAsync({ sectionId: section.id });
    setReviewing(false);
  }

  async function handleTimeExpired() {
    if (!section || section.submitted) return;
    toast.warning("Time is up! Submitting your answers...");
    try {
      await saveMutation.mutateAsync({ sectionId: section.id, answers: sectionAnswers, isDraft: false });
      await submitMutation.mutateAsync({ sectionId: section.id });
    } catch {
      toast.error("Auto-submit failed. Please submit manually.");
    }
  }

  const isWriting = section?.module === "writing";

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
        <div className="flex items-center gap-3">
          {section && section.durationMinutes && !section.submitted && (
            <TestTimer
              attemptId={attempt.id}
              totalDuration={section.durationMinutes}
              onTimeExpired={handleTimeExpired}
            />
          )}
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
            {reviewing && !section.submitted && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-base">Review before submitting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-amber-800">
                    {unansweredQuestions.length > 0
                      ? `${unansweredQuestions.length} question${unansweredQuestions.length === 1 ? "" : "s"} still unanswered.`
                      : "All questions in this section have an answer."}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {section.questions.map((question, index) => {
                      const answered = Boolean(sectionAnswers[question.id]?.trim());
                      return (
                        <button
                          key={question.id}
                          type="button"
                          className={`rounded border px-3 py-2 text-left ${answered ? "border-green-200 bg-white text-green-800" : "border-amber-300 bg-white text-amber-800"}`}
                        >
                          Question {index + 1}: {answered ? "Answered" : "Unanswered"}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
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
            ) : isWriting ? (
              <Card>
                <CardContent className="p-5">
                  <WritingEditor
                    value={sectionAnswers["writing"] || ""}
                    onChange={(val) =>
                      setAnswers({ ...answers, [section.id]: { ...sectionAnswers, writing: val } })
                    }
                    disabled={section.submitted}
                    taskType={section.title?.toLowerCase().includes("task 2") ? "task2" : "task1"}
                    autoSaveKey={`${draftStorageKey}:writing`}
                    autoSaveIntervalMs={3000}
                  />
                </CardContent>
              </Card>
            ) : (
              <IeltsSectionRenderer
                attemptId={attempt.id}
                section={section}
                answers={sectionAnswers}
                disabled={section.submitted}
                onAnswerChange={(questionId, value) =>
                  setAnswers({
                    ...answers,
                    [section.id]: { ...sectionAnswers, [questionId]: value },
                  })
                }
              />
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
              {saveMutation.isPending || submitMutation.isPending
                ? "Submitting..."
                : reviewing
                  ? "Confirm Submit"
                  : unansweredQuestions.length > 0
                    ? `Review ${unansweredQuestions.length} unanswered`
                    : "Review & Submit"}
            </Button>
            {reviewing && !section.submitted && (
              <Button type="button" variant="ghost" onClick={() => setReviewing(false)}>
                Keep editing
              </Button>
            )}
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
