"use client";

import { useEffect, useRef, useCallback } from "react";

type DraftAnswers = Record<string, { answerText?: string; answerJson?: unknown }>;

function getStorageKey(attemptId: string) {
  return `ieltspp:draft:${attemptId}`;
}

export function useDraftPersistence(attemptId: string | null) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback((answers: DraftAnswers) => {
    if (!attemptId || typeof window === "undefined") return;
    try {
      sessionStorage.setItem(getStorageKey(attemptId), JSON.stringify(answers));
    } catch {
      // sessionStorage full or unavailable — silent failure
    }
  }, [attemptId]);

  const loadDraft = useCallback((): DraftAnswers | null => {
    if (!attemptId || typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(getStorageKey(attemptId));
      return raw ? (JSON.parse(raw) as DraftAnswers) : null;
    } catch {
      return null;
    }
  }, [attemptId]);

  const clearDraft = useCallback(() => {
    if (!attemptId || typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(getStorageKey(attemptId));
    } catch {
      // ignore
    }
  }, [attemptId]);

  useEffect(() => {
    const timer = saveTimerRef.current;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { saveDraft, loadDraft, clearDraft };
}
