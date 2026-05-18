"use client";

import { useEffect, useState } from "react";

interface TestTimerProps {
  attemptId: string;
  totalDuration: number;
  initialRemainingSeconds?: number;
  onTimeExpired?: () => void;
  onSync?: (elapsed: number) => void;
}

export function TestTimer({
  attemptId,
  totalDuration,
  initialRemainingSeconds,
  onTimeExpired,
  onSync,
}: TestTimerProps) {
  const [remaining, setRemaining] = useState(initialRemainingSeconds ?? totalDuration * 60);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setRemaining(initialRemainingSeconds ?? totalDuration * 60);
    setIsExpired(false);
  }, [initialRemainingSeconds, totalDuration]);

  useEffect(() => {
    if (totalDuration <= 0 || isExpired) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const newVal = prev - 1;
        if (newVal <= 0) {
          setIsExpired(true);
          onTimeExpired?.();
          return 0;
        }
        return newVal;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isExpired, onTimeExpired, totalDuration]);

  useEffect(() => {
    if (remaining > 0 || isExpired) return;
    setIsExpired(true);
    onTimeExpired?.();
  }, [isExpired, onTimeExpired, remaining]);

  useEffect(() => {
    if (isExpired || totalDuration <= 0) return;
    const syncInterval = setInterval(async () => {
      try {
        await fetch(`/api/attempts/${attemptId}/time`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "keep-alive", timeSpent: 10 }),
        });
        onSync?.(10);
      } catch {
        // Intentionally silent — background keep-alive sync, user-facing errors would be distracting
      }
    }, 10000);
    return () => clearInterval(syncInterval);
  }, [attemptId, isExpired, totalDuration, onSync]);

  if (totalDuration <= 0) return null;

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const isWarning = remaining <= 900;
  const isCritical = remaining <= 300;

  const displayTime = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`${minutes} minutes ${seconds} seconds remaining`}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${isCritical ? "bg-red-100 text-red-700 animate-pulse" : isWarning ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-800"}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{displayTime}</span>
      {isCritical && <span className="text-sm">(Time running out!)</span>}
    </div>
  );
}
