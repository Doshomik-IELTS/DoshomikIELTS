"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import { MediaAssetPicker } from "./media-asset-picker";
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
  questionType: "form_completion",
  optionsText: "",
  answer: "",
  acceptedAnswers: "",
  explanation: "",
  sourceReference: "",
  sourceExcerpt: "",
};

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
  if (questionType === "multiple_choice_single") return "A. \nB. \nC. ";
  if (questionType === "map_labeling" || questionType === "diagram_label") return "A. \nB. \nC. \nD. ";
  return "";
}

function transcriptToTurns(transcript: string) {
  return transcript
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [speaker, ...rest] = line.split(":");
      return {
        speakerId: speaker && rest.length > 0 ? speaker.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") : "speaker_1",
        text: rest.length > 0 ? rest.join(":").trim() : line,
      };
    });
}

function speakersFromTranscript(transcript: string) {
  const names = Array.from(new Set(transcriptToTurns(transcript).map((turn) => turn.speakerId)));
  return names.length > 0
    ? names.map((id) => ({ id, name: id.replace(/_/g, " "), accent: "" }))
    : [{ id: "speaker_1", name: "Speaker 1", accent: "" }];
}

export function ListeningQuickAuthoringPanel({
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
  const [setting, setSetting] = useState(typeof existing?.setting === "string" ? existing.setting : "");
  const [transcript, setTranscript] = useState(typeof existing?.transcript === "string" ? existing.transcript : "");
  const [mediaAssetId, setMediaAssetId] = useState(section.mediaAssetId ?? "");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [groupTitle, setGroupTitle] = useState("Questions 1-5");
  const [groupInstructions, setGroupInstructions] = useState("Complete the notes. Write no more than two words and/or a number.");
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [questions, setQuestions] = useState<QuickQuestion[]>([{ ...DEFAULT_QUESTION }]);

  function updateQuestion(index: number, patch: Partial<QuickQuestion>) {
    setQuestions((current) => current.map((question, i) => i === index ? { ...question, ...patch } : question));
  }

  async function saveAll() {
    setError(null);
    if (!setting.trim() || !transcript.trim()) {
      setError("Setting and transcript are required.");
      return;
    }
    const readyQuestions = questions.filter((question) => question.prompt.trim() && question.answer.trim());
    if (readyQuestions.length === 0) {
      setError("Add at least one question with a prompt and answer.");
      return;
    }

    setSaving(true);
    try {
      const turns = transcriptToTurns(transcript);
      const speakers = speakersFromTranscript(transcript);
      const contentJson = {
        kind: "listening_script",
        partType: "conversation",
        setting: setting.trim(),
        speakers,
        turns,
        transcript: transcript.trim(),
        audio: {
          mediaAssetId: mediaAssetId || null,
          durationSeconds: durationSeconds ? parseInt(durationSeconds, 10) : null,
          playOnceInStrictMode: true,
        },
        sourcePolicy: {
          sourceType: "original",
          voiceSource: mediaAssetId ? "in_house" : "tts",
          licenseChecked,
        },
      };

      await apiFetch(`/api/admin/tests/${testId}/sections?sectionId=${section.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          contentJson,
          mediaAssetId: mediaAssetId || undefined,
          instructions: section.instructions ?? "Listen carefully and answer the questions.",
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
            questionType: readyQuestions[0]?.questionType ?? "listening",
          }),
        });
        groupId = group.group.id;
      }

      const created: QuestionData[] = [];
      for (const question of readyQuestions) {
        const createdQuestion = await apiFetch<QuestionData>("/api/admin/questions", {
          method: "POST",
          body: JSON.stringify({
            sectionId: section.id,
            groupId,
            questionType: question.questionType,
            prompt: question.prompt.trim(),
            optionsJson: parseOptions(question.optionsText),
            difficulty: "intermediate",
            explanation: question.explanation.trim() || undefined,
            sourceSpanJson: question.sourceReference.trim() || question.sourceExcerpt.trim()
              ? {
                  source: "listening_transcript",
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
                maxWords: 3,
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
      setError(e instanceof Error ? e.message : "Could not save listening content.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium text-slate-900">Quick Listening Authoring</p>
            <p className="text-sm text-slate-500">Paste transcript, attach audio, and add questions without JSON.</p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>Open boxes</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Listening Authoring</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <Label className="text-xs">Setting/context</Label>
          <Input value={setting} onChange={(e) => setSetting(e.target.value)} placeholder="A student calling a sports centre" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Transcript</Label>
          <Textarea rows={10} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Advisor: Good morning. How can I help you?&#10;Student: I want to ask about..." className="font-mono text-sm" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Selected media asset ID</Label>
            <Input value={mediaAssetId} onChange={(e) => setMediaAssetId(e.target.value)} placeholder="Optional audio asset ID" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duration seconds</Label>
            <Input type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} />
          </div>
        </div>
        <MediaAssetPicker
          value={mediaAssetId || null}
          onSelect={(asset) => {
            setMediaAssetId(asset.id);
            setDurationSeconds(asset.durationSeconds ? String(asset.durationSeconds) : "");
          }}
        />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Question group title</Label>
            <Input value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} placeholder="Questions 1-5" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Group instruction</Label>
            <Input value={groupInstructions} onChange={(e) => setGroupInstructions(e.target.value)} />
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
                    <option value="form_completion">Form completion</option>
                    <option value="note_completion">Note completion</option>
                    <option value="table_completion">Table completion</option>
                    <option value="multiple_choice_single">Multiple choice</option>
                    <option value="map_labeling">Map labeling</option>
                    <option value="short_answer">Short answer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Correct answer</Label>
                  <Input value={question.answer} onChange={(e) => updateQuestion(index, { answer: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Accepted alternatives</Label>
                  <Input value={question.acceptedAnswers} onChange={(e) => updateQuestion(index, { acceptedAnswers: e.target.value })} placeholder="alt one, alt two" />
                </div>
              </div>
              <Textarea rows={2} value={question.prompt} onChange={(e) => updateQuestion(index, { prompt: e.target.value })} placeholder="Question prompt" />
              <Textarea rows={3} value={question.optionsText} onChange={(e) => updateQuestion(index, { optionsText: e.target.value })} placeholder="A. option one&#10;B. option two" />
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={question.sourceReference} onChange={(e) => updateQuestion(index, { sourceReference: e.target.value })} placeholder="Transcript line 2" />
                <Input value={question.sourceExcerpt} onChange={(e) => updateQuestion(index, { sourceExcerpt: e.target.value })} placeholder="Answer-supporting phrase" />
              </div>
              <Textarea rows={2} value={question.explanation} onChange={(e) => updateQuestion(index, { explanation: e.target.value })} placeholder="Why this answer is correct." />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setQuestions((current) => [...current, { ...DEFAULT_QUESTION }])}>
            Add another question
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={licenseChecked} onChange={(e) => setLicenseChecked(e.target.checked)} />
          Confirm this script/audio is original or properly licensed.
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="button" onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save listening content"}</Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
