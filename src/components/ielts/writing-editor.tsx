"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

type WritingEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  taskType: "task1" | "task2";
  onWordCountChange?: (count: number) => void;
  autoSaveKey?: string;
  autoSaveIntervalMs?: number;
};

const TASK_CONFIG = {
  task1: { minWords: 150, warningAt: 140, rows: 10, label: "Task 1 (150 words min)" },
  task2: { minWords: 250, warningAt: 240, rows: 15, label: "Task 2 (250 words min)" },
} as const;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function WritingEditor({
  value,
  onChange,
  disabled = false,
  taskType,
  onWordCountChange,
  autoSaveKey,
  autoSaveIntervalMs = 5000,
}: WritingEditorProps) {
  const config = TASK_CONFIG[taskType];
  const wordCount = countWords(value);
  const charCount = value.length;
  const isUnderMin = wordCount < config.minWords;
  const isNearWarning = wordCount >= config.warningAt && wordCount < config.minWords;

  const [draftSaved, setDraftSaved] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedRef = useRef(value);

  useEffect(() => {
    onWordCountChange?.(wordCount);
  }, [wordCount, onWordCountChange]);

  useEffect(() => {
    if (!autoSaveKey) return;

    autoSaveTimerRef.current = setInterval(() => {
      if (value !== lastSavedRef.current) {
        window.localStorage.setItem(autoSaveKey, value);
        lastSavedRef.current = value;
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      }
    }, autoSaveIntervalMs);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveKey, autoSaveIntervalMs, value]);

  useEffect(() => {
    if (!autoSaveKey) return;
    const saved = window.localStorage.getItem(autoSaveKey);
    if (saved && !value) {
      onChange(saved);
    }
  }, [autoSaveKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const progressPercent = Math.min((wordCount / config.minWords) * 100, 100);
  const progressColor = isUnderMin
    ? "bg-amber-400"
    : wordCount >= config.minWords
    ? "bg-green-500"
    : "bg-amber-400";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{config.label}</span>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {draftSaved && (
            <span className="text-green-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Draft saved
            </span>
          )}
          <span className={isNearWarning ? "text-amber-600 font-medium" : ""}>
            {wordCount} words
          </span>
          <span>{charCount} chars</span>
        </div>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={config.rows}
        placeholder={
          taskType === "task1"
            ? "Write at least 150 words describing the information in the graph/chart/diagram..."
            : "Write at least 250 words discussing the topic, giving examples and arguments..."
        }
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 resize-y"
      />

      {isUnderMin && (
        <p className={`text-xs ${isNearWarning ? "text-amber-600" : "text-slate-400"}`}>
          {config.minWords - wordCount} more words needed to meet the minimum.
        </p>
      )}
    </div>
  );
}
