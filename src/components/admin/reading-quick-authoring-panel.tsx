"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import type { QuestionData } from "./question-list-editor";
import type { SectionData } from "./section-list-editor";

type QuickQuestion = {
  prompt: string;
  questionType: string;
  optionsText: string;
  answer: string;
  acceptedAnswers: string;
  explanation: string;
  sourceReference: string;
  sourceExcerpt: string;
};

const DEFAULT_QUESTION: QuickQuestion = {
  prompt: "",
  questionType: "true_false_not_given",
  optionsText: "A. True\nB. False\nC. Not Given",
  answer: "",
  acceptedAnswers: "",
  explanation: "",
  sourceReference: "",
  sourceExcerpt: "",
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => ({
      label: String.fromCharCode(65 + index),
      text: paragraph,
    }));
}

function parseOptions(optionsText: string) {
  const entries = optionsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^([A-Z0-9]+)[.)\s-]+(.+)$/i);
      if (match) return [match[1].toUpperCase(), match[2].trim()] as const;
      return [String.fromCharCode(65 + index), line] as const;
    });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function defaultOptionsForType(questionType: string) {
  if (questionType === "true_false_not_given") return "A. True\nB. False\nC. Not Given";
  if (questionType === "yes_no_not_given") return "A. Yes\nB. No\nC. Not Given";
  if (questionType === "multiple_choice_single") return "A. \nB. \nC. ";
  return "";
}

export function ReadingQuickAuthoringPanel({
  testId,
  section,
  onImported,
}: {
  testId: string;
  section: SectionData;
  onImported: (questions: QuestionData[]) => void;
}) {
  const existing = section.contentJson as Record<string, unknown> | null;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passageTitle, setPassageTitle] = useState(typeof existing?.passageTitle === "string" ? existing.passageTitle : section.title);
  const [passageText, setPassageText] = useState(typeof existing?.passageText === "string" ? existing.passageText : "");
  const [topicTags, setTopicTags] = useState(Array.isArray(existing?.topicTags) ? existing.topicTags.map(String).join(", ") : "");
  const [sourceNote, setSourceNote] = useState(
    typeof (existing?.sourcePolicy as Record<string, unknown> | undefined)?.authorNote === "string"
      ? String((existing?.sourcePolicy as Record<string, unknown>).authorNote)
      : "",
  );
  const [copyrightChecked, setCopyrightChecked] = useState(
    Boolean((existing?.sourcePolicy as Record<string, unknown> | undefined)?.copyrightChecked),
  );
  const [groupTitle, setGroupTitle] = useState("Questions 1-5");
  const [groupInstructions, setGroupInstructions] = useState("Choose the correct answer.");
  const [questions, setQuestions] = useState<QuickQuestion[]>([{ ...DEFAULT_QUESTION }]);

  function updateQuestion(index: number, patch: Partial<QuickQuestion>) {
    setQuestions((current) => current.map((question, i) => i === index ? { ...question, ...patch } : question));
  }

  async function saveAll() {
    setError(null);
    if (!passageTitle.trim() || !passageText.trim()) {
      setError("Passage title and passage text are required.");
      return;
    }
    const readyQuestions = questions.filter((question) => question.prompt.trim() && question.answer.trim());
    if (readyQuestions.length === 0) {
      setError("Add at least one question with a prompt and answer.");
      return;
    }

    setSaving(true);
    try {
      const paragraphs = splitParagraphs(passageText);
      const contentJson = {
        kind: "reading_passage",
        ieltsVersion: "academic",
        passageTitle: passageTitle.trim(),
        passageText: passageText.trim(),
        paragraphs,
        wordCount: wordCount(passageText),
        topicTags: topicTags.split(",").map((tag) => tag.trim()).filter(Boolean),
        sourcePolicy: {
          sourceType: "original",
          authorNote: sourceNote.trim(),
          copyrightChecked,
        },
      };

      await apiFetch(`/api/admin/tests/${testId}/sections?sectionId=${section.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          contentJson,
          instructions: section.instructions ?? "Read the passage carefully and answer the questions.",
        }),
      });

      let groupId: string | undefined;
      if (groupTitle.trim() && groupInstructions.trim()) {
        const group = await apiFetch<{ group: { id: string } }>("/api/admin/question-groups", {
          method: "POST",
          body: JSON.stringify({
            sectionId: section.id,
            title: groupTitle.trim(),
            instructions: groupInstructions.trim(),
            questionType: readyQuestions[0]?.questionType ?? "reading",
          }),
        });
        groupId = group.group.id;
      }

      const created: QuestionData[] = [];
      for (const question of readyQuestions) {
        const optionsJson = parseOptions(question.optionsText);
        const createdQuestion = await apiFetch<QuestionData>("/api/admin/questions", {
          method: "POST",
          body: JSON.stringify({
            sectionId: section.id,
            groupId,
            questionType: question.questionType,
            prompt: question.prompt.trim(),
            optionsJson,
            difficulty: "intermediate",
            explanation: question.explanation.trim() || undefined,
            sourceSpanJson: question.sourceReference.trim() || question.sourceExcerpt.trim()
              ? {
                  source: "reading_passage",
                  reference: question.sourceReference.trim(),
                  excerpt: question.sourceExcerpt.trim(),
                }
              : undefined,
            answerKey: {
              canonicalAnswer: question.answer.trim(),
              acceptedAnswersJson: question.acceptedAnswers.trim()
                ? Object.fromEntries(question.acceptedAnswers.split(",").map((answer, index) => [`alt${index + 1}`, answer.trim()]).filter(([, answer]) => answer))
                : undefined,
              scoringRuleJson: {
                caseSensitive: false,
                trimWhitespace: true,
                ignorePunctuation: true,
              },
              explanation: question.explanation.trim() || undefined,
            },
          }),
        });
        created.push(createdQuestion);
      }

      onImported(created);
      setQuestions([{ ...DEFAULT_QUESTION }]);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save reading content.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium text-slate-900">Quick Reading Authoring</p>
            <p className="text-sm text-slate-500">Paste passage and questions into normal boxes. No JSON required.</p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>Open boxes</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Reading Authoring</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Passage title</Label>
            <Input value={passageTitle} onChange={(e) => setPassageTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Topic tags</Label>
            <Input value={topicTags} onChange={(e) => setTopicTags(e.target.value)} placeholder="environment, transport" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Passage text</Label>
          <Textarea
            rows={12}
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            placeholder="Paste the full original reading passage. Separate paragraphs with blank lines."
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500">{wordCount(passageText)} words · {splitParagraphs(passageText).length} paragraph blocks</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Question group title</Label>
            <Input value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} placeholder="Questions 1-5" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Group instruction</Label>
            <Input value={groupInstructions} onChange={(e) => setGroupInstructions(e.target.value)} placeholder="Choose the correct answer." />
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={index} className="space-y-3 rounded border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm text-slate-800">Question {index + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => setQuestions((current) => current.filter((_, i) => i !== index))} disabled={questions.length === 1}>
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    value={question.questionType}
                    onChange={(e) => updateQuestion(index, { questionType: e.target.value, optionsText: defaultOptionsForType(e.target.value) })}
                  >
                    <option value="true_false_not_given">True / False / Not Given</option>
                    <option value="yes_no_not_given">Yes / No / Not Given</option>
                    <option value="multiple_choice_single">Multiple choice</option>
                    <option value="sentence_completion">Sentence completion</option>
                    <option value="summary_completion">Summary completion</option>
                    <option value="matching">Matching</option>
                    <option value="short_answer">Short answer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Correct answer</Label>
                  <Input value={question.answer} onChange={(e) => updateQuestion(index, { answer: e.target.value })} placeholder="A or exact text" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Accepted alternatives</Label>
                  <Input value={question.acceptedAnswers} onChange={(e) => updateQuestion(index, { acceptedAnswers: e.target.value })} placeholder="alt one, alt two" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prompt</Label>
                <Textarea rows={2} value={question.prompt} onChange={(e) => updateQuestion(index, { prompt: e.target.value })} placeholder="Paste the question prompt." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Options</Label>
                <Textarea rows={3} value={question.optionsText} onChange={(e) => updateQuestion(index, { optionsText: e.target.value })} placeholder="A. option one&#10;B. option two&#10;C. option three" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Source reference</Label>
                  <Input value={question.sourceReference} onChange={(e) => updateQuestion(index, { sourceReference: e.target.value })} placeholder="Paragraph B" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Source excerpt</Label>
                  <Input value={question.sourceExcerpt} onChange={(e) => updateQuestion(index, { sourceExcerpt: e.target.value })} placeholder="Answer-supporting phrase" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Explanation</Label>
                <Textarea rows={2} value={question.explanation} onChange={(e) => updateQuestion(index, { explanation: e.target.value })} placeholder="Why this answer is correct." />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setQuestions((current) => [...current, { ...DEFAULT_QUESTION }])}>
            Add another question
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Source note</Label>
          <Textarea rows={2} value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} placeholder="Original passage written in-house, licensed source, etc." />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={copyrightChecked} onChange={(e) => setCopyrightChecked(e.target.checked)} />
            Confirm this passage and questions are original or properly licensed.
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="button" onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save passage and questions"}</Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
