"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { SectionListEditor, type SectionData } from "@/components/admin/section-list-editor";
import { QuestionListEditor, type QuestionData } from "@/components/admin/question-list-editor";
import { WritingSectionEditor } from "@/components/admin/writing-section-editor";
import { SpeakingSectionEditor } from "@/components/admin/speaking-section-editor";
import { IELTS_MODULES } from "@/lib/tests/ielts-types";
import type { IeltsModule } from "@prisma/client";

type TestDetail = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  estimatedDurationMinutes: number | null;
  publishedAt: string | null;
  sections: SectionData[];
};

async function fetchTest(id: string): Promise<TestDetail> {
  return apiFetch<TestDetail>(`/api/admin/tests/${id}`);
}

async function fetchSectionQuestions(sectionId: string): Promise<{ questions: QuestionData[] }> {
  return apiFetch<{ questions: QuestionData[] }>(`/api/admin/questions?sectionId=${sectionId}`);
}

async function updateTestMeta(id: string, data: { title?: string; description?: string; status?: string; publishedAt?: string }) {
  return apiFetch<TestDetail>(`/api/admin/tests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

async function deleteTest(id: string) {
  return apiFetch(`/api/admin/tests/${id}`, { method: "DELETE" });
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
  review: "bg-yellow-100 text-yellow-700",
};

export default function AdminTestBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [testId, setTestId] = useState<string>("");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [sectionQuestions, setSectionQuestions] = useState<Record<string, QuestionData[]>>({});
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "draft" | "published" | "saved">("");

  useEffect(() => {
    params.then((p) => setTestId(p.id));
  }, [params]);

  const { data: test, isLoading } = useQuery({
    queryKey: ["admin-test-builder", testId],
    queryFn: () => fetchTest(testId),
    enabled: !!testId,
  });

  const metaMutation = useMutation({
    mutationFn: (data: { title?: string; description?: string; status?: string; publishedAt?: string }) =>
      updateTestMeta(testId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-test-builder", testId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTest(testId),
    onSuccess: () => router.push("/admin/tests"),
  });

  useEffect(() => {
    if (test) {
      setTitleValue(test.title);
      setDescValue(test.description ?? "");
    }
  }, [test?.id]);

  useEffect(() => {
    if (!activeSectionId || sectionQuestions[activeSectionId]) return;
    fetchSectionQuestions(activeSectionId).then((res) => {
      setSectionQuestions((prev) => ({ ...prev, [activeSectionId!]: res.questions }));
    });
  }, [activeSectionId]);

  const saveMeta = useCallback(async () => {
    setSaving(true);
    setSaveStatus("");
    try {
      await metaMutation.mutateAsync({ title: titleValue, description: descValue || undefined });
      setSaveStatus("saved");
      setEditingTitle(false);
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      console.error("Failed to save metadata:", e);
    } finally {
      setSaving(false);
    }
  }, [titleValue, descValue]);

  async function handleSaveDraft() {
    setSaving(true);
    setSaveStatus("");
    try {
      await metaMutation.mutateAsync({ status: "draft" });
      setSaveStatus("draft");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      console.error("Failed to save draft:", e);
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    setSaveStatus("");
    try {
      await metaMutation.mutateAsync({ status: "published", publishedAt: new Date().toISOString() });
      setSaveStatus("published");
    } catch (e) {
      console.error("Failed to publish:", e);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    deleteMutation.mutate();
  }

  function handleSectionsChange(updated: SectionData[]) {
    if (!test) return;
    const removed = test.sections.filter((s) => !updated.find((u) => u.id === s.id));
    const newMap = { ...sectionQuestions };
    for (const r of removed) delete newMap[r.id];
    setSectionQuestions(newMap);
    if (removed.find((r) => r.id === activeSectionId)) {
      setActiveSectionId(updated[0]?.id ?? null);
    }
  }

  const activeSection = test?.sections.find((s) => s.id === activeSectionId) ?? null;
  const activeQuestions = activeSectionId ? (sectionQuestions[activeSectionId] ?? []) : [];

  function moduleColor(module: string) {
    return IELTS_MODULES.find((m) => m.value === module)?.color ?? "text-slate-700";
  }

  function statusLabel(s: string) {
    if (s === "saved") return "✓ Saved";
    if (s === "draft") return "✓ Saved as draft";
    if (s === "published") return "✓ Published";
    return null;
  }

  if (isLoading && !test) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="lg:col-span-2 h-96" />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        Test not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/tests">
            <Button variant="outline" size="sm">← Back</Button>
          </Link>
          <div>
            {editingTitle ? (
              <div className="space-y-1">
                <Input
                  className="text-2xl font-bold w-auto min-w-[300px]"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveMeta(); }}
                />
                <Textarea
                  className="text-sm w-auto min-w-[400px]"
                  placeholder="Description (optional)"
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveMeta} disabled={saving}>
                    {saving ? "Saving..." : "Save metadata"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingTitle(false); setTitleValue(test.title); setDescValue(test.description ?? ""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <h1
                    className="cursor-pointer text-2xl font-bold text-slate-900 hover:text-blue-600"
                    onClick={() => setEditingTitle(true)}
                    title="Click to edit"
                  >
                    {test.title} ✎
                  </h1>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[test.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {test.status}
                  </span>
                </div>
                {test.description && (
                  <p className="mt-1 text-sm text-slate-500">{test.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-400 capitalize">
                  {test.type.replace("_", " ")} · {test.sections.length} section{test.sections.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {saveStatus && (
            <span className="text-sm text-green-600 font-medium">{statusLabel(saveStatus)}</span>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving}>
              Save Draft
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={saving || test.status === "published"}>
              {test.status === "published" ? "Published" : "Save & Publish"}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-red-500" onClick={handleDelete}>
            Delete Test
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionListEditor
                testId={testId}
                sections={test.sections}
                onSectionsChange={handleSectionsChange}
              />
            </CardContent>
          </Card>

          {test.sections.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Section Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {test.sections.map((s, idx) => (
                    <div
                      key={s.id}
                      className={`cursor-pointer rounded border p-3 transition-colors ${
                        activeSectionId === s.id
                          ? "border-blue-300 bg-blue-50"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setActiveSectionId(s.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium">{s.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 capitalize">
                        <span className={moduleColor(s.module)}>{s.module}</span>
                        {s.partNumber ? ` · Part ${s.partNumber}` : ""}
                        {s.durationMinutes ? ` · ${s.durationMinutes} min` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {activeSection ? (
            <>
              {activeSection.module === "writing" && (
                <WritingSectionEditor
                  testId={testId}
                  section={activeSection}
                  onContentUpdate={(json) => {
                    apiFetch(`/api/admin/tests/${testId}/sections?sectionId=${activeSection.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ contentJson: json }),
                    }).then(() => {
                      qc.invalidateQueries({ queryKey: ["admin-test-builder", testId] });
                    }).catch(console.error);
                  }}
                />
              )}
              {activeSection.module === "speaking" && (
                <SpeakingSectionEditor
                  testId={testId}
                  section={activeSection}
                  onContentUpdate={(json) => {
                    apiFetch(`/api/admin/tests/${testId}/sections?sectionId=${activeSection.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ contentJson: json }),
                    }).then(() => {
                      qc.invalidateQueries({ queryKey: ["admin-test-builder", testId] });
                    }).catch(console.error);
                  }}
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className={`font-medium capitalize ${moduleColor(activeSection.module)}`}>
                      {activeSection.module}
                    </span>
                    <span>·</span>
                    <span>{activeSection.title}</span>
                    {activeSection.partNumber ? (
                      <Badge variant="neutral" className="capitalize">Part {activeSection.partNumber}</Badge>
                    ) : null}
                  </CardTitle>
                  {activeSection.instructions && (
                    <p className="text-sm text-slate-500">{activeSection.instructions}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <QuestionListEditor
                    key={activeSection.id}
                    sectionId={activeSection.id}
                    questions={activeQuestions}
                    module={activeSection.module as IeltsModule}
                    onQuestionsChange={(qs) => setSectionQuestions((prev) => ({ ...prev, [activeSection.id]: qs }))}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-20 text-slate-500">
                <div className="text-center">
                  <p className="text-lg font-medium">IELTS Test Builder</p>
                  <p className="mt-1 text-sm">Add sections on the left, then click one to edit its content and questions.</p>
                  {test.sections.length === 0 && (
                    <p className="mt-2 text-xs text-slate-400">
                      A full mock test should have: Listening, Reading, Writing, and Speaking sections.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
