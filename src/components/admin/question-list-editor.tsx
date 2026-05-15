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
  groupId: string | null;
  questionType: string;
  prompt: string;
  optionsJson: Record<string, string> | null;
  orderIndex: number;
  difficulty: string;
  explanation: string | null;
  sourceSpanJson: Record<string, unknown> | null;
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
  groups?: QuestionGroupData[];
  sectionContent?: Record<string, unknown> | null;
  onQuestionsChange?: (questions: QuestionData[]) => void;
};

export type QuestionGroupData = {
  id: string;
  title: string;
  instructions: string;
  questionType: string;
  orderIndex: number;
  displayJson: Record<string, unknown> | null;
};

type AnswerForm = {
  canonicalAnswer: string;
  acceptedAnswers: string[];
  scoringRule: string;
  scoringMode: string;
  maxWords: string;
  caseSensitive: boolean;
  ignorePunctuation: boolean;
  allowNumber: boolean;
  partialCredit: boolean;
  explanation: string;
};

type SourceBlock = {
  reference: string;
  excerpt: string;
  startOffset?: number;
  endOffset?: number;
};

type BulkRow = {
  prompt: string;
  answer: string;
  type?: string;
  options?: Record<string, string>;
};

const IELTS_PRESETS: Record<string, { label: string; type: string; prompt: string; options?: Record<string, string>; scoringRule?: string }> = {
  reading_headings: {
    label: "Reading: matching headings",
    type: "matching",
    prompt: "Choose the correct heading for this paragraph.",
    scoringRule: "paragraph_heading_match",
  },
  reading_t_f_ng: {
    label: "Reading: True / False / Not Given",
    type: "true_false_not_given",
    prompt: "Decide whether the statement agrees with the information in the passage.",
    options: { A: "True", B: "False", C: "Not Given" },
    scoringRule: "single_choice",
  },
  reading_completion: {
    label: "Reading: sentence/summary completion",
    type: "sentence_completion",
    prompt: "Complete the sentence using words from the passage.",
    scoringRule: "maxWords=3; ignorePunctuation=true; caseSensitive=false",
  },
  listening_form: {
    label: "Listening: form/note completion",
    type: "form_completion",
    prompt: "Complete the notes. Write no more than two words and/or a number.",
    scoringRule: "maxWords=2; allowNumber=true; ignorePunctuation=true; caseSensitive=false",
  },
  listening_map: {
    label: "Listening: map/diagram labeling",
    type: "map_labeling",
    prompt: "Label the map using the options provided.",
    scoringRule: "single_choice",
  },
  listening_mcq: {
    label: "Listening: multiple choice",
    type: "multiple_choice_single",
    prompt: "Choose the correct answer.",
    options: { A: "", B: "", C: "" },
    scoringRule: "single_choice",
  },
};

function subtypeHelp(questionType: string) {
  if (questionType === "true_false_not_given") {
    return {
      title: "True / False / Not Given",
      fields: ["Statement prompt", "Answer: True, False, or Not_Given", "Source paragraph/excerpt", "Explanation"],
      answerHint: "Use True, False, or Not_Given.",
    };
  }
  if (questionType === "yes_no_not_given") {
    return {
      title: "Yes / No / Not Given",
      fields: ["Writer-claim prompt", "Answer: Yes, No, or Not_Given", "Source paragraph/excerpt", "Explanation"],
      answerHint: "Use Yes, No, or Not_Given.",
    };
  }
  if (questionType === "multiple_choice_single" || questionType === "multiple_choice_multi") {
    return {
      title: questionType === "multiple_choice_multi" ? "Multiple Choice - Multiple Answers" : "Multiple Choice",
      fields: ["Question stem", "Options A-D", "Correct option key", "Explanation"],
      answerHint: questionType === "multiple_choice_multi" ? "Use comma-separated keys, for example A,C." : "Use one option key, for example B.",
    };
  }
  if (["sentence_completion", "summary_completion", "note_completion", "table_completion", "form_completion", "flow_chart_completion", "fill_blank", "short_answer"].includes(questionType)) {
    return {
      title: "Completion / Short Answer",
      fields: ["Prompt with blank", "Exact answer", "Accepted alternatives", "Word-limit scoring rule"],
      answerHint: "Use the exact expected answer; add alternatives below.",
    };
  }
  if (questionType === "matching") {
    return {
      title: "Matching",
      fields: ["Item to match", "Options/headings in Answer Options", "Correct option key", "Source support"],
      answerHint: "Use the matching option key.",
    };
  }
  if (questionType === "map_labeling" || questionType === "diagram_label") {
    return {
      title: "Map / Diagram Labeling",
      fields: ["Label prompt", "Available labels/options", "Correct label key", "Optional visual reference"],
      answerHint: "Use the correct label key.",
    };
  }
  return null;
}

function sourceBlocksFromContent(module: IeltsModule, sectionContent?: Record<string, unknown> | null): SourceBlock[] {
  if (!sectionContent) return [];
  if (module === "reading" && Array.isArray(sectionContent.paragraphs)) {
    let cursor = 0;
    return sectionContent.paragraphs
      .map((paragraph) => {
        if (!paragraph || typeof paragraph !== "object") return null;
        const record = paragraph as Record<string, unknown>;
        const label = typeof record.label === "string" ? record.label : "";
        const text = typeof record.text === "string" ? record.text : "";
        if (!text.trim()) return null;
        const startOffset = cursor;
        const endOffset = startOffset + text.length;
        cursor = endOffset + 1;
        return { reference: label ? `Paragraph ${label}` : "Passage", excerpt: text, startOffset, endOffset };
      })
      .filter((block): block is NonNullable<typeof block> => Boolean(block));
  }
  if (module === "listening" && typeof sectionContent.transcript === "string") {
    let cursor = 0;
    return sectionContent.transcript
      .split("\n")
      .map((line, index) => {
        const trimmed = line.trim();
        const startOffset = cursor + line.indexOf(trimmed);
        cursor += line.length + 1;
        return trimmed ? { reference: `Transcript line ${index + 1}`, excerpt: trimmed, startOffset, endOffset: startOffset + trimmed.length } : null;
      })
      .filter((block): block is NonNullable<typeof block> => Boolean(block));
  }
  return [];
}

function defaultAnswerForm(): AnswerForm {
  return {
    canonicalAnswer: "",
    acceptedAnswers: [],
    scoringRule: "",
    scoringMode: "exact",
    maxWords: "",
    caseSensitive: false,
    ignorePunctuation: true,
    allowNumber: true,
    partialCredit: false,
    explanation: "",
  };
}

function scoringJson(answer: AnswerForm) {
  const rule: Record<string, unknown> = {
    mode: answer.scoringMode,
    caseSensitive: answer.caseSensitive,
    ignorePunctuation: answer.ignorePunctuation,
    allowNumber: answer.allowNumber,
    partialCredit: answer.partialCredit,
  };
  const maxWords = Number.parseInt(answer.maxWords, 10);
  if (Number.isFinite(maxWords) && maxWords > 0) rule.maxWords = maxWords;
  if (answer.scoringRule.trim()) rule.note = answer.scoringRule.trim();
  return rule;
}

function answerFormFromQuestion(q: QuestionData): AnswerForm {
  const scoring = q.answerKey?.scoringRuleJson ?? {};
  const scoringRecord = scoring as Record<string, unknown>;
  return {
    ...defaultAnswerForm(),
    canonicalAnswer: q.answerKey?.canonicalAnswer ?? "",
    acceptedAnswers: q.answerKey?.acceptedAnswersJson
      ? Object.values(q.answerKey.acceptedAnswersJson as Record<string, unknown>).map(String)
      : [],
    scoringRule: typeof scoringRecord.note === "string"
      ? scoringRecord.note
      : typeof scoringRecord.rule === "string"
        ? scoringRecord.rule
        : "",
    scoringMode: typeof scoringRecord.mode === "string" ? scoringRecord.mode : "exact",
    maxWords: typeof scoringRecord.maxWords === "number" ? String(scoringRecord.maxWords) : "",
    caseSensitive: scoringRecord.caseSensitive === true,
    ignorePunctuation: scoringRecord.ignorePunctuation !== false,
    allowNumber: scoringRecord.allowNumber !== false,
    partialCredit: scoringRecord.partialCredit === true,
    explanation: q.answerKey?.explanation ?? "",
  };
}

function parseBulkRows(text: string, fallbackType: string): BulkRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [prompt = "", answer = "", type = fallbackType, options = ""] = line.split("\t");
      const optionPairs = options
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item, index) => {
          const separator = item.indexOf(":");
          const [key, value] = separator >= 0
            ? [item.slice(0, separator), item.slice(separator + 1)]
            : [String.fromCharCode(65 + index), item];
          return [key.trim(), value.trim()] as const;
        });
      return {
        prompt: prompt.trim(),
        answer: answer.trim(),
        type: type.trim() || fallbackType,
        options: optionPairs.length > 0 ? Object.fromEntries(optionPairs) : undefined,
      };
    })
    .filter((row) => row.prompt && row.answer);
}

export function QuestionListEditor({ sectionId, questions, module, groups = [], sectionContent, onQuestionsChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newType, setNewType] = useState(MODULE_QUESTION_TYPES[module][0]?.value ?? "multiple_choice_single");
  const [newPrompt, setNewPrompt] = useState("");
  const [newOptions, setNewOptions] = useState<Record<string, string>>({});
  const [newDifficulty, setNewDifficulty] = useState("basic");
  const [newGroupId, setNewGroupId] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newSourceExcerpt, setNewSourceExcerpt] = useState("");
  const [newSourceReference, setNewSourceReference] = useState("");
  const [newSourceStart, setNewSourceStart] = useState<number | null>(null);
  const [newSourceEnd, setNewSourceEnd] = useState<number | null>(null);
  const [newAnswer, setNewAnswer] = useState<AnswerForm>(() => defaultAnswerForm());
  const [bulkText, setBulkText] = useState("");
  const [bulkAdding, setBulkAdding] = useState(false);
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<Partial<QuestionData>>({});
  const [editAnswer, setEditAnswer] = useState<AnswerForm>(() => defaultAnswerForm());
  const [editSourceExcerpt, setEditSourceExcerpt] = useState("");
  const [editSourceReference, setEditSourceReference] = useState("");
  const [editSourceStart, setEditSourceStart] = useState<number | null>(null);
  const [editSourceEnd, setEditSourceEnd] = useState<number | null>(null);

  const questionTypes = MODULE_QUESTION_TYPES[module] ?? [];
  const sourceBlocks = sourceBlocksFromContent(module, sectionContent);

  function resetNewForm() {
    setNewType(questionTypes[0]?.value ?? "multiple_choice_single");
    setNewPrompt("");
    setNewOptions({});
    setNewDifficulty("basic");
    setNewGroupId("");
    setNewExplanation("");
    setNewSourceExcerpt("");
    setNewSourceReference("");
    setNewSourceStart(null);
    setNewSourceEnd(null);
    setNewAnswer(defaultAnswerForm());
  }

  function applyPreset(key: string) {
    const preset = IELTS_PRESETS[key];
    if (!preset) return;
    setNewType(preset.type);
    setNewPrompt(preset.prompt);
    setNewOptions(preset.options ?? getDefaultOptionsForType(preset.type) ?? {});
    setNewAnswer((answer) => ({ ...answer, scoringRule: preset.scoringRule ?? answer.scoringRule }));
  }

  function applySourceBlock(block: SourceBlock) {
    setNewSourceReference(block.reference);
    setNewSourceExcerpt(block.excerpt.length > 260 ? `${block.excerpt.slice(0, 260)}...` : block.excerpt);
    setNewSourceStart(block.startOffset ?? null);
    setNewSourceEnd(block.endOffset ?? null);
  }

  function applyEditSourceBlock(block: SourceBlock) {
    setEditSourceReference(block.reference);
    setEditSourceExcerpt(block.excerpt.length > 260 ? `${block.excerpt.slice(0, 260)}...` : block.excerpt);
    setEditSourceStart(block.startOffset ?? null);
    setEditSourceEnd(block.endOffset ?? null);
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
        groupId: newGroupId || undefined,
        explanation: newExplanation || undefined,
      };

      if (Object.keys(newOptions).length > 0) {
        payload.optionsJson = newOptions;
      }

      if ((module === "reading" || module === "listening") && (newSourceExcerpt.trim() || newSourceReference.trim())) {
        payload.sourceSpanJson = {
          source: module === "listening" ? "listening_transcript" : "reading_passage",
          excerpt: newSourceExcerpt.trim(),
          reference: newSourceReference.trim(),
          ...(newSourceStart !== null && newSourceEnd !== null ? { startOffset: newSourceStart, endOffset: newSourceEnd } : {}),
        };
      }

      if (newAnswer.canonicalAnswer.trim()) {
        payload.answerKey = {
          canonicalAnswer: newAnswer.canonicalAnswer.trim(),
          acceptedAnswersJson: newAnswer.acceptedAnswers.length > 0
            ? Object.fromEntries(newAnswer.acceptedAnswers.map((a, i) => [`alt${i + 1}`, a]))
            : undefined,
          scoringRuleJson: scoringJson(newAnswer),
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

  async function addBulkQuestions() {
    const rows = parseBulkRows(bulkText, newType);
    if (rows.length === 0) return;
    setBulkAdding(true);
    try {
      const created: QuestionData[] = [];
      for (const [index, row] of rows.entries()) {
        const options = row.options ?? getDefaultOptionsForType(row.type ?? newType) ?? {};
        const question = await apiFetch<QuestionData>("/api/admin/questions", {
          method: "POST",
          body: JSON.stringify({
            sectionId,
            questionType: row.type ?? newType,
            prompt: row.prompt,
            difficulty: newDifficulty,
            groupId: newGroupId || undefined,
            optionsJson: Object.keys(options).length > 0 ? options : undefined,
            orderIndex: questions.length + index,
            answerKey: {
              canonicalAnswer: row.answer,
              scoringRuleJson: scoringJson(newAnswer),
            },
          }),
        });
        created.push(question);
      }
      onQuestionsChange?.([...questions, ...created]);
      setBulkText("");
    } catch (e) {
      console.error("Failed to add bulk questions:", e);
    } finally {
      setBulkAdding(false);
    }
  }

  async function updateQuestion() {
    if (!editingId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...editForm };
      if ((module === "reading" || module === "listening") && (editSourceExcerpt.trim() || editSourceReference.trim())) {
        payload.sourceSpanJson = {
          source: module === "listening" ? "listening_transcript" : "reading_passage",
          excerpt: editSourceExcerpt.trim(),
          reference: editSourceReference.trim(),
          ...(editSourceStart !== null && editSourceEnd !== null ? { startOffset: editSourceStart, endOffset: editSourceEnd } : {}),
        };
      }
      if (editAnswer.canonicalAnswer.trim()) {
        payload.answerKey = {
          canonicalAnswer: editAnswer.canonicalAnswer.trim(),
          acceptedAnswersJson: editAnswer.acceptedAnswers.length > 0
            ? Object.fromEntries(editAnswer.acceptedAnswers.map((a, i) => [`alt${i + 1}`, a]))
            : undefined,
          scoringRuleJson: scoringJson(editAnswer),
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
      setEditAnswer(defaultAnswerForm());
      setEditSourceExcerpt("");
      setEditSourceReference("");
      setEditSourceStart(null);
      setEditSourceEnd(null);
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

  async function moveQuestion(questionId: string, direction: -1 | 1) {
    const currentIndex = questions.findIndex((question) => question.id === questionId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= questions.length) return;
    const next = [...questions];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(nextIndex, 0, moved);
    const reordered = next.map((question, index) => ({ ...question, orderIndex: index }));
    onQuestionsChange?.(reordered);
    try {
      await apiFetch("/api/admin/questions/reorder", {
        method: "PATCH",
        body: JSON.stringify({ sectionId, questionIds: reordered.map((question) => question.id) }),
      });
    } catch (e) {
      console.error("Failed to reorder questions:", e);
      onQuestionsChange?.(questions);
    }
  }

  async function reorderQuestions(next: QuestionData[]) {
    const reordered = next.map((question, index) => ({ ...question, orderIndex: index }));
    onQuestionsChange?.(reordered);
    try {
      await apiFetch("/api/admin/questions/reorder", {
        method: "PATCH",
        body: JSON.stringify({ sectionId, questionIds: reordered.map((question) => question.id) }),
      });
    } catch (e) {
      console.error("Failed to reorder questions:", e);
      onQuestionsChange?.(questions);
    }
  }

  async function dropQuestion(targetQuestionId: string) {
    if (!draggedQuestionId || draggedQuestionId === targetQuestionId) return;
    const from = questions.findIndex((question) => question.id === draggedQuestionId);
    const to = questions.findIndex((question) => question.id === targetQuestionId);
    if (from < 0 || to < 0) return;
    const next = [...questions];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggedQuestionId(null);
    await reorderQuestions(next);
  }

  function startEdit(q: QuestionData) {
    setEditingId(q.id);
    setEditForm({ ...q });
    setEditAnswer(answerFormFromQuestion(q));
    setEditSourceExcerpt(typeof q.sourceSpanJson?.excerpt === "string" ? q.sourceSpanJson.excerpt : "");
    setEditSourceReference(typeof q.sourceSpanJson?.reference === "string" ? q.sourceSpanJson.reference : "");
    setEditSourceStart(typeof q.sourceSpanJson?.startOffset === "number" ? q.sourceSpanJson.startOffset : null);
    setEditSourceEnd(typeof q.sourceSpanJson?.endOffset === "number" ? q.sourceSpanJson.endOffset : null);
  }

  function typeLabel(qtype: string) {
    return questionTypes.find((t) => t.value === qtype)?.label ?? qtype;
  }

  const needsOptions = ["multiple_choice_single", "multiple_choice_multi", "true_false_not_given", "yes_no_not_given", "map_labeling", "diagram_label"].includes(newType);
  const needsAnswer = !["speaking_part1", "speaking_part2", "speaking_part3"].includes(newType);
  const supportsSourceSpan = module === "reading" || module === "listening";
  const activeSubtypeHelp = subtypeHelp(newType);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Question ({module})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(module === "reading" || module === "listening") && (
              <div className="space-y-1">
                <Label className="text-xs">IELTS Preset</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  defaultValue=""
                  onChange={(e) => {
                    applyPreset(e.target.value);
                    e.currentTarget.value = "";
                  }}
                >
                  <option value="">Choose a preset...</option>
                  {Object.entries(IELTS_PRESETS)
                    .filter(([key]) => key.startsWith(module))
                    .map(([key, preset]) => (
                      <option key={key} value={key}>{preset.label}</option>
                    ))}
                </select>
              </div>
            )}
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
            {groups.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Question Group</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                >
                  <option value="">No group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.title}</option>
                  ))}
                </select>
              </div>
            )}
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

          {activeSubtypeHelp && (
            <div className="rounded border border-blue-100 bg-blue-50 p-4 text-sm">
              <p className="font-semibold text-blue-900">{activeSubtypeHelp.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeSubtypeHelp.fields.map((field) => (
                  <span key={field} className="rounded bg-white px-2 py-1 text-xs text-blue-800 ring-1 ring-blue-100">
                    {field}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-blue-800">{activeSubtypeHelp.answerHint}</p>
            </div>
          )}

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
              <details className="rounded border border-slate-200 bg-white p-3" open>
                <summary className="cursor-pointer text-xs font-semibold text-slate-700">Scoring controls</summary>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Mode</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                      value={newAnswer.scoringMode}
                      onChange={(e) => setNewAnswer((answer) => ({ ...answer, scoringMode: e.target.value }))}
                    >
                      <option value="exact">Exact match</option>
                      <option value="normalized">Normalized text</option>
                      <option value="choice">Choice key</option>
                      <option value="multi_choice">Multiple choice keys</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max words</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newAnswer.maxWords}
                      onChange={(e) => setNewAnswer((answer) => ({ ...answer, maxWords: e.target.value }))}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Advanced note</Label>
                    <Input
                      value={newAnswer.scoringRule}
                      onChange={(e) => setNewAnswer((answer) => ({ ...answer, scoringRule: e.target.value }))}
                      placeholder="optional internal note"
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["caseSensitive", "Case sensitive"],
                    ["ignorePunctuation", "Ignore punctuation"],
                    ["allowNumber", "Allow numbers"],
                    ["partialCredit", "Partial credit"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(newAnswer[key as keyof AnswerForm])}
                        onChange={(e) => setNewAnswer((answer) => ({ ...answer, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </details>
            </div>
          )}

          {supportsSourceSpan && needsAnswer && (
            <div className="rounded border border-slate-100 bg-slate-50 p-4 space-y-3">
              <Label className="text-xs font-semibold">Source Support</Label>
              {sourceBlocks.length > 0 && (
                <div className="max-h-56 space-y-2 overflow-y-auto rounded border border-slate-200 bg-white p-2">
                  {sourceBlocks.map((block) => (
                    <button
                      key={`${block.reference}-${block.excerpt.slice(0, 24)}`}
                      type="button"
                      className="block w-full rounded border border-slate-100 p-2 text-left text-xs hover:bg-blue-50"
                      onClick={() => applySourceBlock(block)}
                    >
                      <span className="font-semibold text-slate-700">{block.reference}</span>
                      <span className="mt-1 block text-slate-500 line-clamp-2">{block.excerpt}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Reference</Label>
                  <Input
                    value={newSourceReference}
                    onChange={(e) => setNewSourceReference(e.target.value)}
                    placeholder={module === "reading" ? "Paragraph B" : "00:45-00:58"}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Supporting excerpt</Label>
                  <Input
                    value={newSourceExcerpt}
                    onChange={(e) => setNewSourceExcerpt(e.target.value)}
                    placeholder="Exact passage/transcript support"
                  />
                </div>
              </div>
            </div>
          )}

          <Button onClick={addQuestion} disabled={adding || !newPrompt.trim()}>
            {adding ? "Adding..." : "Add Question"}
          </Button>
        </CardContent>
      </Card>

      <details className="rounded border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
          Bulk paste question rows
        </summary>
        <div className="space-y-3 border-t border-slate-100 p-4">
          <p className="text-xs text-slate-500">
            Paste one row per question: prompt, answer, optional type, optional options separated by tabs. Options use A:Text|B:Text.
          </p>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={5}
            placeholder={"What is the answer?\tB\tmultiple_choice_single\tA:One|B:Two|C:Three"}
          />
          <Button type="button" variant="outline" onClick={addBulkQuestions} disabled={bulkAdding || parseBulkRows(bulkText, newType).length === 0}>
            {bulkAdding ? "Adding..." : `Add ${parseBulkRows(bulkText, newType).length || ""} rows`}
          </Button>
        </div>
      </details>

      <div>
        <h4 className="mb-2 font-semibold text-slate-700">Questions ({questions.length})</h4>
        {questions.length === 0 ? (
          <p className="text-sm text-slate-500">No questions added yet.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <Card
                key={q.id}
                draggable={editingId !== q.id}
                onDragStart={() => setDraggedQuestionId(q.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropQuestion(q.id)}
                className={draggedQuestionId === q.id ? "border-blue-300 bg-blue-50" : undefined}
              >
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
                      {groups.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs">Question Group</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                            value={editForm.groupId ?? q.groupId ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, groupId: e.target.value || null }))}
                          >
                            <option value="">No group</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>{group.title}</option>
                            ))}
                          </select>
                        </div>
                      )}
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
                        <details className="rounded border border-slate-200 bg-white p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-700">Scoring controls</summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Mode</Label>
                              <select
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                                value={editAnswer.scoringMode}
                                onChange={(e) => setEditAnswer((answer) => ({ ...answer, scoringMode: e.target.value }))}
                              >
                                <option value="exact">Exact match</option>
                                <option value="normalized">Normalized text</option>
                                <option value="choice">Choice key</option>
                                <option value="multi_choice">Multiple choice keys</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Max words</Label>
                              <Input
                                type="number"
                                min={1}
                                value={editAnswer.maxWords}
                                onChange={(e) => setEditAnswer((answer) => ({ ...answer, maxWords: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Advanced note</Label>
                              <Input
                                value={editAnswer.scoringRule}
                                onChange={(e) => setEditAnswer((answer) => ({ ...answer, scoringRule: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                              ["caseSensitive", "Case sensitive"],
                              ["ignorePunctuation", "Ignore punctuation"],
                              ["allowNumber", "Allow numbers"],
                              ["partialCredit", "Partial credit"],
                            ].map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={Boolean(editAnswer[key as keyof AnswerForm])}
                                  onChange={(e) => setEditAnswer((answer) => ({ ...answer, [key]: e.target.checked }))}
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                    {supportsSourceSpan && (
                      <div className="rounded border border-slate-100 bg-slate-50 p-3 space-y-2">
                        <Label className="text-xs font-semibold">Source Support</Label>
                        {sourceBlocks.length > 0 && (
                          <div className="max-h-40 space-y-2 overflow-y-auto rounded border border-slate-200 bg-white p-2">
                            {sourceBlocks.map((block) => (
                              <button
                                key={`edit-${block.reference}-${block.excerpt.slice(0, 24)}`}
                                type="button"
                                className="block w-full rounded border border-slate-100 p-2 text-left text-xs hover:bg-blue-50"
                                onClick={() => applyEditSourceBlock(block)}
                              >
                                <span className="font-semibold text-slate-700">{block.reference}</span>
                                <span className="mt-1 block text-slate-500 line-clamp-2">{block.excerpt}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Reference</Label>
                            <Input value={editSourceReference} onChange={(e) => setEditSourceReference(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Excerpt</Label>
                            <Input value={editSourceExcerpt} onChange={(e) => setEditSourceExcerpt(e.target.value)} />
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
                          {q.groupId ? `${groups.find((group) => group.id === q.groupId)?.title ?? "Grouped"} · ` : ""}
                          <span className="font-medium">{typeLabel(q.questionType)}</span>
                          {" · "}{q.difficulty}{q.answerKey ? " · answered" : " · no answer"}
                          {supportsSourceSpan ? (q.sourceSpanJson ? " · sourced" : " · no source") : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => moveQuestion(q.id, -1)} disabled={idx === 0}>Up</Button>
                      <Button variant="outline" size="sm" onClick={() => moveQuestion(q.id, 1)} disabled={idx === questions.length - 1}>Down</Button>
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
