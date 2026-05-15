"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import type { SectionData } from "./section-list-editor";

type ReadingContent = {
  kind: "reading_passage";
  ieltsVersion: "academic";
  passageTitle: string;
  passageText: string;
  paragraphs: { label: string; text: string }[];
  wordCount: number;
  topicTags: string[];
  sourcePolicy: {
    sourceType: "original";
    authorNote: string;
    copyrightChecked: boolean;
  };
};

type Props = {
  testId: string;
  section: SectionData;
  onContentUpdate?: (contentJson: Record<string, unknown>) => void;
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text, index) => ({
      label: String.fromCharCode(65 + index),
      text,
    }));
}

export function ReadingSectionEditor({ testId, section, onContentUpdate }: Props) {
  const existing = section.contentJson as Partial<ReadingContent> | null;
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<ReadingContent>({
    kind: "reading_passage",
    ieltsVersion: "academic",
    passageTitle: existing?.passageTitle ?? section.title,
    passageText: existing?.passageText ?? "",
    paragraphs: existing?.paragraphs ?? [],
    wordCount: existing?.wordCount ?? 0,
    topicTags: existing?.topicTags ?? [],
    sourcePolicy: {
      sourceType: "original",
      authorNote: existing?.sourcePolicy?.authorNote ?? "",
      copyrightChecked: existing?.sourcePolicy?.copyrightChecked ?? false,
    },
  });

  const calculatedWordCount = useMemo(() => wordCount(content.passageText), [content.passageText]);

  function updatePassage(text: string) {
    setContent((current) => ({
      ...current,
      passageText: text,
      paragraphs: splitParagraphs(text),
      wordCount: wordCount(text),
    }));
  }

  async function saveContent() {
    setSaving(true);
    try {
      const payload = {
        ...content,
        wordCount: calculatedWordCount,
        paragraphs: splitParagraphs(content.passageText),
      };
      const updated = await apiFetch<{ contentJson: Record<string, unknown> }>(
        `/api/admin/tests/${testId}/sections?sectionId=${section.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            contentJson: payload,
            instructions: section.instructions ?? "Read the passage carefully and answer the questions.",
          }),
        },
      );
      onContentUpdate?.(updated.contentJson);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reading-title">Passage title</Label>
            <Input
              id="reading-title"
              value={content.passageTitle}
              onChange={(e) => setContent((current) => ({ ...current, passageTitle: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reading-tags">Topic tags</Label>
            <Input
              id="reading-tags"
              value={content.topicTags.join(", ")}
              onChange={(e) => setContent((current) => ({
                ...current,
                topicTags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
              }))}
              placeholder="environment, cities"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reading-passage">Passage text</Label>
          <Textarea
            id="reading-passage"
            rows={14}
            value={content.passageText}
            onChange={(e) => updatePassage(e.target.value)}
            placeholder="Paste original passage text. Separate paragraphs with blank lines."
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500">
            {calculatedWordCount} words · {splitParagraphs(content.passageText).length} paragraph blocks
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reading-source-note">Source note</Label>
          <Textarea
            id="reading-source-note"
            rows={2}
            value={content.sourcePolicy.authorNote}
            onChange={(e) => setContent((current) => ({
              ...current,
              sourcePolicy: { ...current.sourcePolicy, authorNote: e.target.value },
            }))}
            placeholder="Written in-house, adapted from public-domain source, etc."
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={content.sourcePolicy.copyrightChecked}
              onChange={(e) => setContent((current) => ({
                ...current,
                sourcePolicy: { ...current.sourcePolicy, copyrightChecked: e.target.checked },
              }))}
            />
            Confirm this passage is original or properly licensed.
          </label>
        </div>

        <Button onClick={saveContent} disabled={saving}>
          {saving ? "Saving..." : "Save Reading Passage"}
        </Button>
      </CardContent>
    </Card>
  );
}
