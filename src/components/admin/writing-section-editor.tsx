"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import type { SectionData } from "./section-list-editor";

type WritingTaskContent = {
  taskType: "task_1_academic" | "task_1_gt" | "task_2";
  question: string;
  instructions: string;
  minWords: number;
  maxWords: number;
  sampleAnswer: string;
  tips: string[];
  bandDescriptors: Record<string, string>;
};

type Props = {
  testId: string;
  section: SectionData;
  onContentUpdate?: (contentJson: Record<string, unknown>) => void;
};

export function WritingSectionEditor({ testId, section, onContentUpdate }: Props) {
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<WritingTaskContent>(() => {
    const existing = section.contentJson as WritingTaskContent | null;
    return existing ?? {
      taskType: "task_2",
      question: "",
      instructions: "Write at least 250 words.",
      minWords: 250,
      maxWords: 500,
      sampleAnswer: "",
      tips: [],
      bandDescriptors: {},
    };
  });

  async function saveContent() {
    setSaving(true);
    try {
      const updated = await apiFetch<{ contentJson: Record<string, unknown> }>(
        `/api/admin/tests/${testId}/sections?sectionId=${section.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            contentJson: content,
            instructions: content.instructions,
          }),
        },
      );
      onContentUpdate?.(updated.contentJson);
    } catch (e) {
      console.error("Failed to save writing content:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Task Type</Label>
            <div className="flex gap-3">
              {[
                { value: "task_1_academic", label: "Task 1 — Academic", desc: "Describe a chart/graph/diagram" },
                { value: "task_1_gt", label: "Task 1 — General Training", desc: "Write a formal/semi-formal letter" },
                { value: "task_2", label: "Task 2 — Essay", desc: "Write an essay discussing a view/argument" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setContent((c) => ({ ...c, taskType: opt.value as WritingTaskContent["taskType"] }))}
                  className={`rounded border px-4 py-2 text-left text-sm transition-colors ${
                    content.taskType === opt.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Question / Task Prompt</Label>
            <Textarea
              value={content.question}
              onChange={(e) => setContent((c) => ({ ...c, question: e.target.value }))}
              placeholder={
                content.taskType === "task_2"
                  ? "The internet has greatly impacted the way people work. Discuss both views and give your opinion..."
                  : content.taskType === "task_1_academic"
                  ? "The graph below shows... Summarise the information by selecting and reporting the main features..."
                  : "You recently stayed at a hotel and had a wonderful experience. Write a letter to the manager to thank them..."
              }
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Instructions</Label>
            <Textarea
              value={content.instructions}
              onChange={(e) => setContent((c) => ({ ...c, instructions: e.target.value }))}
              placeholder="Additional instructions for the learner..."
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Minimum Words</Label>
              <Input
                type="number"
                min={50}
                value={content.minWords}
                onChange={(e) => setContent((c) => ({ ...c, minWords: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Maximum Words</Label>
              <Input
                type="number"
                min={50}
                value={content.maxWords}
                onChange={(e) => setContent((c) => ({ ...c, maxWords: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Sample Answer (optional)</Label>
            <Textarea
              value={content.sampleAnswer}
              onChange={(e) => setContent((c) => ({ ...c, sampleAnswer: e.target.value }))}
              placeholder="A band 8+ example response..."
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Strategy Tips (optional)</Label>
            <div className="space-y-2">
              {content.tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{i + 1}.</span>
                  <Input
                    value={tip}
                    onChange={(e) => {
                      const updated = [...content.tips];
                      updated[i] = e.target.value;
                      setContent((c) => ({ ...c, tips: updated }));
                    }}
                    placeholder={`Tip ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContent((c) => ({ ...c, tips: c.tips.filter((_, j) => j !== i) }))}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContent((c) => ({ ...c, tips: [...c.tips, ""] }))}
              >
                + Add Tip
              </Button>
            </div>
          </div>

          <Button onClick={saveContent} disabled={saving}>
            {saving ? "Saving..." : "Save Writing Task"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}