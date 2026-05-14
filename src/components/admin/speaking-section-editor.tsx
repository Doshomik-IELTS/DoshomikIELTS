"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import type { SectionData } from "./section-list-editor";

type CueCard = {
  part: "part_1" | "part_2" | "part_3";
  questions: string[];
  bulletPoints: string[];
  prepTimeSeconds: number;
  responseTimeSeconds: number;
  sampleResponse: string;
  followUpQuestions: string[];
};

type SpeakingContent = {
  cueCards: CueCard[];
};

type Props = {
  testId: string;
  section: SectionData;
  onContentUpdate?: (contentJson: Record<string, unknown>) => void;
};

function CueCardEditor({
  cueCard,
  cueIndex,
  onUpdate,
}: {
  cueCard: CueCard;
  cueIndex: number;
  onUpdate: (updated: CueCard) => void;
}) {
  const partLabels = {
    part_1: "Part 1 — Introduction & Interview",
    part_2: "Part 2 — Long Turn (Cue Card)",
    part_3: "Part 3 — Discussion",
  };

  return (
    <div className="rounded border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-700">
          Cue Card {cueIndex + 1}: {partLabels[cueCard.part]}
        </h4>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Part</Label>
          <select
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={cueCard.part}
            onChange={(e) => onUpdate({ ...cueCard, part: e.target.value as CueCard["part"] })}
          >
            <option value="part_1">Part 1 — Introduction</option>
            <option value="part_2">Part 2 — Long Turn</option>
            <option value="part_3">Part 3 — Discussion</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Prep Time (seconds)</Label>
          <Input
            type="number"
            min={0}
            value={cueCard.prepTimeSeconds}
            onChange={(e) => onUpdate({ ...cueCard, prepTimeSeconds: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Response Time (seconds)</Label>
          <Input
            type="number"
            min={0}
            value={cueCard.responseTimeSeconds}
            onChange={(e) => onUpdate({ ...cueCard, responseTimeSeconds: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
      </div>

      {cueCard.part === "part_1" && (
        <div className="space-y-2">
          <Label className="text-xs">Interview Questions (one per line)</Label>
          <Textarea
            value={cueCard.questions.join("\n")}
            onChange={(e) => onUpdate({ ...cueCard, questions: e.target.value.split("\n").filter(Boolean) })}
            placeholder="What is your name?\nWhere do you live?\nWhat do you do for work?"
            rows={4}
          />
        </div>
      )}

      {cueCard.part === "part_2" && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Topic (what the learner should talk about)</Label>
            <Textarea
              value={cueCard.questions.join("\n")}
              onChange={(e) => onUpdate({ ...cueCard, questions: e.target.value.split("\n").filter(Boolean) })}
              placeholder="Describe a book that you have recently read.\nYou should mention:\n- what the book was about\n- why you decided to read it\n- how you felt about it"
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Bullet Points to Cover</Label>
            <div className="space-y-2">
              {cueCard.bulletPoints.map((point, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-xs text-slate-400">{i + 1}.</span>
                  <Input
                    value={point}
                    onChange={(e) => {
                      const updated = [...cueCard.bulletPoints];
                      updated[i] = e.target.value;
                      onUpdate({ ...cueCard, bulletPoints: updated });
                    }}
                    placeholder="Describe this aspect..."
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate({ ...cueCard, bulletPoints: cueCard.bulletPoints.filter((_, j) => j !== i) })}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ ...cueCard, bulletPoints: [...cueCard.bulletPoints, ""] })}
              >
                + Add Bullet Point
              </Button>
            </div>
          </div>
        </>
      )}

      {cueCard.part === "part_3" && (
        <div className="space-y-2">
          <Label className="text-xs">Discussion Questions (one per line)</Label>
          <Textarea
            value={cueCard.questions.join("\n")}
            onChange={(e) => onUpdate({ ...cueCard, questions: e.target.value.split("\n").filter(Boolean) })}
            placeholder="What are the benefits of reading books?\nHow has technology changed the way people read?"
            rows={5}
          />
          <div className="space-y-2">
            <Label className="text-xs">Follow-up Questions (one per line)</Label>
            <Textarea
              value={cueCard.followUpQuestions.join("\n")}
              onChange={(e) => onUpdate({ ...cueCard, followUpQuestions: e.target.value.split("\n").filter(Boolean) })}
              placeholder="Why do you think some people prefer e-books?"
              rows={3}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs">Sample Response (for admin reference)</Label>
        <Textarea
          value={cueCard.sampleResponse}
          onChange={(e) => onUpdate({ ...cueCard, sampleResponse: e.target.value })}
          placeholder="A strong example response..."
          rows={4}
        />
      </div>
    </div>
  );
}

export function SpeakingSectionEditor({ testId, section, onContentUpdate }: Props) {
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<SpeakingContent>(() => {
    const existing = section.contentJson as SpeakingContent | null;
    return existing ?? { cueCards: [] };
  });

  async function saveContent() {
    setSaving(true);
    try {
      const updated = await apiFetch<{ contentJson: Record<string, unknown> }>(
        `/api/admin/tests/${testId}/sections?sectionId=${section.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ contentJson: content }),
        },
      );
      onContentUpdate?.(updated.contentJson);
    } catch (e) {
      console.error("Failed to save speaking content:", e);
    } finally {
      setSaving(false);
    }
  }

  function updateCueCard(index: number, updated: CueCard) {
    const newCards = [...content.cueCards];
    newCards[index] = updated;
    setContent({ cueCards: newCards });
  }

  function addCueCard(part: CueCard["part"]) {
    const defaults: Record<string, CueCard> = {
      part_1: {
        part: "part_1",
        questions: [],
        bulletPoints: [],
        prepTimeSeconds: 0,
        responseTimeSeconds: 60,
        sampleResponse: "",
        followUpQuestions: [],
      },
      part_2: {
        part: "part_2",
        questions: [],
        bulletPoints: [],
        prepTimeSeconds: 60,
        responseTimeSeconds: 120,
        sampleResponse: "",
        followUpQuestions: [],
      },
      part_3: {
        part: "part_3",
        questions: [],
        bulletPoints: [],
        prepTimeSeconds: 0,
        responseTimeSeconds: 120,
        sampleResponse: "",
        followUpQuestions: [],
      },
    };
    setContent({ cueCards: [...content.cueCards, defaults[part]] });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Speaking Cue Cards</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addCueCard("part_1")}>+ Part 1 Card</Button>
          <Button variant="outline" size="sm" onClick={() => addCueCard("part_2")}>+ Part 2 Card</Button>
          <Button variant="outline" size="sm" onClick={() => addCueCard("part_3")}>+ Part 3 Card</Button>
        </div>
      </div>

      {content.cueCards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <p>No cue cards yet. Add Part 1, 2, or 3 cards above.</p>
            <p className="mt-1 text-sm">Each card represents a speaking task within this section.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {content.cueCards.map((card, i) => (
            <CueCardEditor
              key={i}
              cueCard={card}
              cueIndex={i}
              onUpdate={(updated) => updateCueCard(i, updated)}
            />
          ))}
        </div>
      )}

      <Button onClick={saveContent} disabled={saving}>
        {saving ? "Saving..." : "Save Speaking Section"}
      </Button>
    </div>
  );
}