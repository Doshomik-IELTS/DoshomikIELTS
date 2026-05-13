"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import type { IeltsModule } from "@prisma/client";
import {
  MODULE_QUESTION_TYPES,
  DIFFICULTY_OPTIONS,
  getDefaultOptionsForType,
} from "@/lib/tests/ielts-types";

export type QuestionData = {
  id: string;
  questionType: string;
  prompt: string;
  optionsJson: Record<string, string> | null;
  orderIndex: number;
  difficulty: string;
  explanation: string | null;
  answerKey: {
    canonicalAnswer: string;
    acceptedAnswersJson: Record<string, unknown> | null;
    scoringRuleJson: Record<string, unknown> | null;
    explanation: string | null;
  } | null;
};

type Props = {
  sectionId: string;
  questions: QuestionData[];
  module: IeltsModule;
  onQuestionsChange?: (questions: QuestionData[]) => void;
};

type AnswerForm = {
  canonicalAnswer: string;
  acceptedAnswers: string[];
  scoringRule: string;
  explanation: string;
};

export function QuestionListEditor({ sectionId, questions, module, onQuestionsChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newType, setNewType] = useState(MODULE_QUESTION_TYPES[module][0]?.value ?? "multiple_choice_single");
  const [newPrompt, setNewPrompt] = useState("");
  const [newOptions, setNewOptions] = useState<Record<string, string>>({});
  const [newDifficulty, setNewDifficulty] = useState("basic");
  const [newExplanation, setNewExplanation] = useState("");
  const [newAnswer, setNewAnswer] = useState<AnswerForm>({ canonicalAnswer: "", acceptedAnswers: [], scoringRule: "", explanation: "" });

  const [editForm, setEditForm] = useState<Partial<QuestionData>>({});
  const [editAnswer, setEditAnswer] = useState<AnswerForm>({ canonicalAnswer: "", acceptedAnswers: [], scoringRule: "", explanation: "" });

  const questionTypes = MODULE_QUESTION_TYPES[module] ?? [];

  function resetNewForm() {
    setNewType(questionTypes[0]?.value ?? "multiple_choice_single");
    setNewPrompt("");
    setNewOptions({});
    setNewDifficulty("basic");
    setNewExplanation("");
    setNewAnswer({ canonicalAnswer: "", acceptedAnswers: [], scoringRule: "", explanation: "" });
  }

  async function addQuestion() {
    if (!newPrompt.trim()) return;
    setAdding(true);
    try {
      const payload: Record<string, unknown> = {
        sectionId,
        questionType: newType,
        prompt: newPrompt.trim(),
        difficulty: newDifficulty,
        explanation: newExplanation || undefined,
      };

      if (Object.keys(newOptions).length > 0) {
        payload.optionsJson = newOptions;
      }

      if (newAnswer.canonicalAnswer.trim()) {
        payload.answerKey = {
          canonicalAnswer: newAnswer.canonicalAnswer.trim(),
          acceptedAnswersJson: newAnswer.acceptedAnswers.length > 0
            ? Object.fromEntries(newAnswer.acceptedAnswers.map((a, i) => [`alt${i + 1}`, a]))
            : undefined,
          scoringRuleJson: newAnswer.scoringRule ? { rule: newAnswer.scoringRule } : undefined,
          explanation: newAnswer.explanation || undefined,
        };
      }

      const created = await apiFetch<QuestionData>("/api/admin/questions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onQuestionsChange?.([...questions, created]);
      resetNewForm();
    } catch (e) {
      console.error("Failed to add question:", e);
    } finally {
      setAdding(false);
    }
  }

  async function updateQuestion() {
    if (!editingId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...editForm };
      if (editAnswer.canonicalAnswer.trim()) {
        payload.answerKey = {
          canonicalAnswer: editAnswer.canonicalAnswer.trim(),
          acceptedAnswersJson: editAnswer.acceptedAnswers.length > 0
            ? Object.fromEntries(editAnswer.acceptedAnswers.map((a, i) => [`alt${i + 1}`, a]))
            : undefined,
          scoringRuleJson: editAnswer.scoringRule ? { rule: editAnswer.scoringRule } : undefined,
          explanation: editAnswer.explanation || undefined,
        };
      }
      const updated = await apiFetch<QuestionData>(`/api/admin/questions/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onQuestionsChange?.(questions.map((q) => q.id === editingId ? { ...q, ...updated } : q));
      setEditingId(null);
      setEditForm({});
      setEditAnswer({ canonicalAnswer: "", acceptedAnswers: [], scoringRule: "", explanation: "" });
    } catch (e) {
      console.error("Failed to update question:", e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm("Delete this question?")) return;
    try {
      await apiFetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
      onQuestionsChange?.(questions.filter((q) => q.id !== questionId));
    } catch (e) {
      console.error("Failed to delete question:", e);
    }
  }

  function startEdit(q: QuestionData) {
    setEditingId(q.id);
    setEditForm({ ...q });
    setEditAnswer({
      canonicalAnswer: q.answerKey?.canonicalAnswer ?? "",
      acceptedAnswers: q.answerKey?.acceptedAnswersJson
        ? Object.values(q.answerKey.acceptedAnswersJson as Record<string, unknown>).map(String)
        : [],
      scoringRule: q.answerKey?.scoringRuleJson
        ? (q.answerKey.scoringRuleJson as Record<string, unknown>).rule as string ?? ""
        : "",
      explanation: q.answerKey?.explanation ?? "",
    });
  }

  function typeLabel(qtype: string) {
    return questionTypes.find((t) => t.value === qtype)?.label ?? qtype;
  }

  const needsOptions = ["multiple_choice_single", "multiple_choice_multi", "true_false_not_given", "yes_no_not_given", "map_labeling", "diagram_label"].includes(newType);
  const needsAnswer = !["speaking_part1", "speaking_part2", "speaking_part3"].includes(newType);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Question ({module})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Question Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                value={newType}
                onChange={(e) => {
                  setNewType(e.target.value);
                  const defaults = getDefaultOptionsForType(e.target.value);
                  setNewOptions(defaults ?? {});
                }}
              >
                {questionTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {questionTypes.find((t) => t.value === newType)?.description && (
                <p className="text-xs text-slate-500">
                  {questionTypes.find((t) => t.value === newType)?.description}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Difficulty</Label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
              >
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Question Prompt</Label>
            <Textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Enter the question prompt..."
              rows={3}
            />
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label className="text-xs">Answer Options</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(newOptions).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-sm font-medium text-slate-500">{key}</span>
                    <Input
                      value={val}
                      onChange={(e) => setNewOptions((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={`Option ${key}`}
                    />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextKey = String.fromCharCode(65 + Object.keys(newOptions).length);
                  setNewOptions((prev) => ({ ...prev, [nextKey]: "" }));
                }}
              >
                Add Option
              </Button>
            </div>
          )}

          {needsAnswer && (
            <div className="rounded border border-slate-100 bg-slate-50 p-4 space-y-3">
              <Label className="text-xs font-semibold">Answer Key</Label>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Correct Answer</Label>
                  {needsOptions ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                      value={newAnswer.canonicalAnswer}
                      onChange={(e) => setNewAnswer((a) => ({ ...a, canonicalAnswer: e.target.value }))}
                    >
                      <option value="">Select correct answer...</option>
                      {Object.entries(newOptions).map(([k, v]) => (
                        <option key={k} value={k}>{k}. {v || "(empty)"}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={newAnswer.canonicalAnswer}
                      onChange={(e) => setNewAnswer((a) => ({ ...a, canonicalAnswer: e.target.value }))}
                      placeholder="Correct answer text"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Accepted Alternatives (comma-separated)</Label>
                  <Input
                    value={newAnswer.acceptedAnswers.join(", ")}
                    onChange={(e) => setNewAnswer((a) => ({
                      ...a,
                      acceptedAnswers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    }))}
                    placeholder="alt1, alt2, alt3"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Explanation</Label>
                <Textarea
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Explanation for the correct answer..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <Button onClick={addQuestion} disabled={adding || !newPrompt.trim()}>
            {adding ? "Adding..." : "Add Question"}
          </Button>
        </CardContent>
      </Card>

      <div>
        <h4 className="mb-2 font-semibold text-slate-700">Questions ({questions.length})</h4>
        {questions.length === 0 ? (
          <p className="text-sm text-slate-500">No questions added yet.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <Card key={q.id}>
                {editingId === q.id ? (
                  <CardContent className="space-y-3 p-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Prompt</Label>
                      <Textarea
                        value={editForm.prompt ?? q.prompt}
                        onChange={(e) => setEditForm((f) => ({ ...f, prompt: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                          value={editForm.questionType ?? q.questionType}
                          onChange={(e) => setEditForm((f) => ({ ...f, questionType: e.target.value }))}
                        >
                          {questionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Difficulty</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                          value={editForm.difficulty ?? q.difficulty}
                          onChange={(e) => setEditForm((f) => ({ ...f, difficulty: e.target.value }))}
                        >
                          {DIFFICULTY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Order Index</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editForm.orderIndex ?? idx}
                          onChange={(e) => setEditForm((f) => ({ ...f, orderIndex: parseInt(e.target.value, 10) }))}
                        />
                      </div>
                    </div>
                    {q.answerKey && (
                      <div className="rounded border border-slate-100 bg-slate-50 p-3 space-y-2">
                        <Label className="text-xs font-semibold">Answer Key</Label>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Canonical Answer</Label>
                            <Input value={editAnswer.canonicalAnswer} onChange={(e) => setEditAnswer((a) => ({ ...a, canonicalAnswer: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Explanation</Label>
                            <Input value={editAnswer.explanation} onChange={(e) => setEditAnswer((a) => ({ ...a, explanation: e.target.value }))} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={updateQuestion} disabled={saving} size="sm">{saving ? "Saving..." : "Save"}</Button>
                      <Button onClick={() => setEditingId(null)} variant="outline" size="sm">Cancel</Button>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="flex items-start justify-between p-4">
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm text-slate-800 line-clamp-2">{q.prompt}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          <span className="font-medium">{typeLabel(q.questionType)}</span>
                          {" · "}{q.difficulty}{q.answerKey ? " · ✅ answered" : " · ❌ no answer"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => startEdit(q)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteQuestion(q.id)} className="text-red-600">Delete</Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}