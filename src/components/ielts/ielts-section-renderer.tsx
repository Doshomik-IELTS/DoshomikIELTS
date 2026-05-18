"use client";

import { useEffect, useMemo, useRef, useState, memo } from "react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";
import { ObjectiveQuestionRenderer, type ObjectiveQuestion } from "./objective-question-renderer";

export type IeltsQuestionGroup = {
  id: string;
  title: string;
  instructions: string;
  questionType: string;
  orderIndex: number;
};

export type IeltsSection = {
  id: string;
  module: string;
  title: string;
  instructions?: string | null;
  durationMinutes?: number | null;
  contentJson?: Record<string, unknown> | null;
  mediaAssetId?: string | null;
  groups?: IeltsQuestionGroup[];
  questions: (ObjectiveQuestion & { groupId?: string | null })[];
};

type SourceSpan = {
  excerpt?: string;
  reference?: string;
  startOffset?: number;
  endOffset?: number;
};

function getString(content: Record<string, unknown> | null | undefined, key: string) {
  const value = content?.[key];
  return typeof value === "string" ? value : "";
}

function getParagraphs(content: Record<string, unknown> | null | undefined) {
  const paragraphs = content?.paragraphs;
  if (!Array.isArray(paragraphs)) return [];
  return paragraphs
    .map((paragraph) => {
      if (!paragraph || typeof paragraph !== "object") return null;
      const record = paragraph as Record<string, unknown>;
      const label = typeof record.label === "string" ? record.label : "";
      const text = typeof record.text === "string" ? record.text : "";
      return text ? { label, text } : null;
    })
    .filter((paragraph): paragraph is { label: string; text: string } => Boolean(paragraph));
}

function getSourceSpan(value: unknown): SourceSpan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    excerpt: typeof record.excerpt === "string" ? record.excerpt : undefined,
    reference: typeof record.reference === "string" ? record.reference : undefined,
    startOffset: typeof record.startOffset === "number" ? record.startOffset : undefined,
    endOffset: typeof record.endOffset === "number" ? record.endOffset : undefined,
  };
}

function highlightedText(text: string, spans: SourceSpan[], baseOffset = 0) {
  const ranges = spans
    .flatMap((span) => {
      if (typeof span.startOffset === "number" && typeof span.endOffset === "number") {
        const start = Math.max(0, span.startOffset - baseOffset);
        const end = Math.min(text.length, span.endOffset - baseOffset);
        return end > start ? [{ start, end }] : [];
      }
      if (span.excerpt) {
        const index = text.toLowerCase().indexOf(span.excerpt.toLowerCase());
        return index >= 0 ? [{ start: index, end: index + span.excerpt.length }] : [];
      }
      return [];
    })
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) return text;

  const merged: { start: number; end: number }[] = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  const parts: ReactNode[] = [];
  let cursor = 0;
  merged.forEach((range, index) => {
    if (range.start > cursor) parts.push(text.slice(cursor, range.start));
    parts.push(
      <mark key={`${range.start}-${range.end}-${index}`} className="rounded bg-yellow-100 px-0.5 text-slate-900">
        {text.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function StrictAudioPlayer({ src, storageKey }: { src: string; storageKey: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setStarted(false);
    setProgress(0);
    setCompleted(window.localStorage.getItem(storageKey) === "completed");
  }, [storageKey]);

  async function start() {
    const audio = audioRef.current;
    if (!audio || completed || started) return;
    setStarted(true);
    audio.currentTime = 0;
    await audio.play();
  }

  return (
    <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setProgress(audio.duration ? Math.min(100, (audio.currentTime / audio.duration) * 100) : 0);
        }}
        onEnded={() => {
          window.localStorage.setItem(storageKey, "completed");
          setCompleted(true);
          setStarted(false);
          setProgress(100);
        }}
      />
      <div className="h-2 overflow-hidden rounded bg-white">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {completed ? "Audio already played in strict mode." : started ? "Audio playing. Replay is locked." : "Strict mode: audio can be played once."}
        </p>
        <button
          type="button"
          onClick={start}
          disabled={started || completed}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {completed ? "Played" : started ? "Playing" : "Play audio"}
        </button>
      </div>
    </div>
  );
}

function useSignedMediaUrl(mediaAssetId?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaAssetId) return;
    let cancelled = false;
    apiFetch<{ signedUrl: string }>(`/api/media/${mediaAssetId}/download-url`)
      .then((result) => {
        if (!cancelled) setUrl(result.signedUrl);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load audio");
      });
    return () => {
      cancelled = true;
    };
  }, [mediaAssetId]);

  return { url, error };
}

function SectionMaterial({
  section,
  sourceSpans,
  attemptId,
  showTranscript = true,
}: {
  section: IeltsSection;
  sourceSpans: SourceSpan[];
  attemptId?: string;
  showTranscript?: boolean;
}) {
  const content = section.contentJson;
  const paragraphs = getParagraphs(content);
  const passageTitle = getString(content, "passageTitle");
  const transcript = getString(content, "transcript");
  const setting = getString(content, "setting");
  const audioAssetId =
    section.mediaAssetId ??
    ((content?.audio && typeof content.audio === "object"
      ? (content.audio as Record<string, unknown>).mediaAssetId
      : null) as string | null);
  const { url: audioUrl, error: audioError } = useSignedMediaUrl(section.module === "listening" ? audioAssetId : null);

  if (section.module === "reading") {
    let paragraphOffset = 0;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{passageTitle || section.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-slate-800">
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph) => {
              const offset = paragraphOffset;
              paragraphOffset += paragraph.text.length + 1;
              return (
              <p key={paragraph.label || paragraph.text.slice(0, 20)}>
                {paragraph.label ? <span className="mr-2 font-bold">{paragraph.label}</span> : null}
                {highlightedText(paragraph.text, sourceSpans, offset)}
              </p>
              );
            })
          ) : (
            <p className="whitespace-pre-wrap">{highlightedText(getString(content, "passageText"), sourceSpans)}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (section.module === "listening") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listening Material</CardTitle>
          {setting ? <p className="text-sm text-slate-500">{setting}</p> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {audioUrl ? (
            <StrictAudioPlayer src={audioUrl} storageKey={`ieltspp:audio:${attemptId ?? "preview"}:${section.id}`} />
          ) : audioAssetId ? (
            <p className="text-sm text-slate-500">{audioError ?? "Loading audio..."}</p>
          ) : (
            <p className="text-sm text-amber-700">No audio has been attached to this listening section.</p>
          )}
          {showTranscript && transcript ? (
            <details className="rounded border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">Transcript</summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{highlightedText(transcript, sourceSpans)}</p>
            </details>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return null;
}

const QuestionCard = memo(function QuestionCard({
  question,
  index,
  value,
  disabled,
  onChange,
}: {
  question: ObjectiveQuestion;
  index: number;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="mb-3 text-sm font-medium text-slate-500">Question {index + 1}</p>
        <ObjectiveQuestionRenderer question={question} value={value} disabled={disabled} onChange={onChange} />
      </CardContent>
    </Card>
  );
});

export function IeltsSectionRenderer({
  section,
  attemptId,
  answers,
  showTranscript = true,
  disabled,
  onAnswerChange,
}: {
  section: IeltsSection;
  attemptId?: string;
  answers: Record<string, string>;
  showTranscript?: boolean;
  disabled?: boolean;
  onAnswerChange: (questionId: string, value: string) => void;
}) {
  const groups = section.groups ?? [];
  const sourceSpans = useMemo(
    () => section.questions.map((question) => getSourceSpan(question.sourceSpanJson)).filter((span): span is SourceSpan => Boolean(span)),
    [section.questions],
  );
  const groupedIds = new Set(groups.map((group) => group.id));
  const ungroupedQuestions = section.questions.filter((question) => !question.groupId || !groupedIds.has(question.groupId));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <SectionMaterial section={section} sourceSpans={sourceSpans} attemptId={attemptId} showTranscript={showTranscript} />
      </div>
      <div className="space-y-4">
        {section.instructions ? (
          <Card>
            <CardContent className="p-4 text-sm text-slate-700">{section.instructions}</CardContent>
          </Card>
        ) : null}

        {groups.map((group) => {
          const groupQuestions = section.questions.filter((question) => question.groupId === group.id);
          if (groupQuestions.length === 0) return null;
          return (
            <div key={group.id} className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{group.title}</p>
                    <Badge variant="neutral">{group.questionType}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{group.instructions}</p>
                </CardContent>
              </Card>
              {groupQuestions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  value={answers[question.id] ?? ""}
                  disabled={disabled}
                  onChange={(value) => onAnswerChange(question.id, value)}
                />
              ))}
            </div>
          );
        })}

        {ungroupedQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id] ?? ""}
            disabled={disabled}
            onChange={(value) => onAnswerChange(question.id, value)}
          />
        ))}
      </div>
    </div>
  );
}
