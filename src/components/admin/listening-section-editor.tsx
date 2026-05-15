"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import type { SectionData } from "./section-list-editor";
import { MediaAssetPicker } from "./media-asset-picker";

type Speaker = {
  id: string;
  name: string;
  accent: string;
};

type Turn = {
  speakerId: string;
  text: string;
};

type ListeningContent = {
  kind: "listening_script";
  partType: "conversation" | "monologue" | "academic_discussion" | "lecture";
  setting: string;
  speakers: Speaker[];
  turns: Turn[];
  transcript: string;
  audio: {
    mediaAssetId: string | null;
    durationSeconds: number | null;
    playOnceInStrictMode: boolean;
  };
  sourcePolicy: {
    sourceType: "original";
    voiceSource: "tts" | "in_house" | "licensed";
    licenseChecked: boolean;
  };
};

type Props = {
  testId: string;
  section: SectionData;
  onContentUpdate?: (contentJson: Record<string, unknown>) => void;
};

function transcriptFromTurns(turns: Turn[], speakers: Speaker[]) {
  const speakerName = new Map(speakers.map((speaker) => [speaker.id, speaker.name]));
  return turns
    .map((turn) => `${speakerName.get(turn.speakerId) ?? turn.speakerId}: ${turn.text}`)
    .join("\n");
}

export function ListeningSectionEditor({ testId, section, onContentUpdate }: Props) {
  const existing = section.contentJson as Partial<ListeningContent> | null;
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<ListeningContent>({
    kind: "listening_script",
    partType: existing?.partType ?? "conversation",
    setting: existing?.setting ?? "",
    speakers: existing?.speakers ?? [
      { id: "speaker_1", name: "Speaker 1", accent: "" },
      { id: "speaker_2", name: "Speaker 2", accent: "" },
    ],
    turns: existing?.turns ?? [],
    transcript: existing?.transcript ?? "",
    audio: {
      mediaAssetId: existing?.audio?.mediaAssetId ?? section.mediaAssetId ?? null,
      durationSeconds: existing?.audio?.durationSeconds ?? null,
      playOnceInStrictMode: existing?.audio?.playOnceInStrictMode ?? true,
    },
    sourcePolicy: {
      sourceType: "original",
      voiceSource: existing?.sourcePolicy?.voiceSource ?? "tts",
      licenseChecked: existing?.sourcePolicy?.licenseChecked ?? false,
    },
  });

  function syncTranscript(next: Partial<ListeningContent>) {
    const speakers = next.speakers ?? content.speakers;
    const turns = next.turns ?? content.turns;
    return transcriptFromTurns(turns, speakers);
  }

  async function saveContent() {
    setSaving(true);
    try {
      const payload = {
        ...content,
        transcript: content.transcript.trim() || transcriptFromTurns(content.turns, content.speakers),
      };
      const updated = await apiFetch<{ contentJson: Record<string, unknown> }>(
        `/api/admin/tests/${testId}/sections?sectionId=${section.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            contentJson: payload,
            mediaAssetId: payload.audio.mediaAssetId || undefined,
            instructions: section.instructions ?? "Listen carefully and answer the questions.",
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
            <Label htmlFor="listening-part-type">Part type</Label>
            <select
              id="listening-part-type"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={content.partType}
              onChange={(e) => setContent((current) => ({ ...current, partType: e.target.value as ListeningContent["partType"] }))}
            >
              <option value="conversation">Conversation</option>
              <option value="monologue">Monologue</option>
              <option value="academic_discussion">Academic discussion</option>
              <option value="lecture">Lecture</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listening-setting">Setting/context</Label>
            <Input
              id="listening-setting"
              value={content.setting}
              onChange={(e) => setContent((current) => ({ ...current, setting: e.target.value }))}
              placeholder="A student asking about a local sports centre"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Speakers</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setContent((current) => ({
                ...current,
                speakers: [...current.speakers, { id: `speaker_${current.speakers.length + 1}`, name: `Speaker ${current.speakers.length + 1}`, accent: "" }],
              }))}
            >
              Add speaker
            </Button>
          </div>
          {content.speakers.map((speaker, index) => (
            <div key={speaker.id} className="grid gap-2 md:grid-cols-3">
              <Input
                value={speaker.name}
                onChange={(e) => {
                  const speakers = content.speakers.slice();
                  speakers[index] = { ...speaker, name: e.target.value };
                  setContent((current) => ({ ...current, speakers, transcript: syncTranscript({ speakers }) }));
                }}
                placeholder="Name"
              />
              <Input
                value={speaker.accent}
                onChange={(e) => {
                  const speakers = content.speakers.slice();
                  speakers[index] = { ...speaker, accent: e.target.value };
                  setContent((current) => ({ ...current, speakers }));
                }}
                placeholder="Accent"
              />
              <Input value={speaker.id} readOnly className="font-mono text-xs" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Script turns</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setContent((current) => {
                const turns = [...current.turns, { speakerId: current.speakers[0]?.id ?? "speaker_1", text: "" }];
                return { ...current, turns, transcript: transcriptFromTurns(turns, current.speakers) };
              })}
            >
              Add turn
            </Button>
          </div>
          {content.turns.length === 0 ? (
            <p className="rounded border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No script turns yet.
            </p>
          ) : (
            content.turns.map((turn, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  value={turn.speakerId}
                  onChange={(e) => {
                    const turns = content.turns.slice();
                    turns[index] = { ...turn, speakerId: e.target.value };
                    setContent((current) => ({ ...current, turns, transcript: transcriptFromTurns(turns, current.speakers) }));
                  }}
                >
                  {content.speakers.map((speaker) => (
                    <option key={speaker.id} value={speaker.id}>{speaker.name}</option>
                  ))}
                </select>
                <Textarea
                  rows={2}
                  value={turn.text}
                  onChange={(e) => {
                    const turns = content.turns.slice();
                    turns[index] = { ...turn, text: e.target.value };
                    setContent((current) => ({ ...current, turns, transcript: transcriptFromTurns(turns, current.speakers) }));
                  }}
                  placeholder="Speaker line"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const turns = content.turns.filter((_, i) => i !== index);
                    setContent((current) => ({ ...current, turns, transcript: transcriptFromTurns(turns, current.speakers) }));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="listening-media">Media asset ID</Label>
            <Input
              id="listening-media"
              value={content.audio.mediaAssetId ?? ""}
              onChange={(e) => setContent((current) => ({
                ...current,
                audio: { ...current.audio, mediaAssetId: e.target.value.trim() || null },
              }))}
              placeholder="Audio asset UUID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listening-duration">Duration seconds</Label>
            <Input
              id="listening-duration"
              type="number"
              value={content.audio.durationSeconds ?? ""}
              onChange={(e) => setContent((current) => ({
                ...current,
                audio: { ...current.audio, durationSeconds: e.target.value ? parseInt(e.target.value, 10) : null },
              }))}
            />
          </div>
        </div>

        <MediaAssetPicker
          value={content.audio.mediaAssetId}
          onSelect={(asset) => setContent((current) => ({
            ...current,
            audio: {
              ...current.audio,
              mediaAssetId: asset.id,
              durationSeconds: asset.durationSeconds,
            },
          }))}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={content.sourcePolicy.licenseChecked}
            onChange={(e) => setContent((current) => ({
              ...current,
              sourcePolicy: { ...current.sourcePolicy, licenseChecked: e.target.checked },
            }))}
          />
          Confirm script/audio is original or properly licensed.
        </label>

        <Button onClick={saveContent} disabled={saving}>
          {saving ? "Saving..." : "Save Listening Script"}
        </Button>
      </CardContent>
    </Card>
  );
}
