"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import type { ApiEnvelope } from "@/lib/api/response";
import type { MeResponse } from "@/lib/api/me-types";
import { isPostHogConfigured } from "@/lib/analytics/posthog";

export function PostHogIdentity() {
  useEffect(() => {
    if (!isPostHogConfigured()) return;

    let cancelled = false;

    async function identifyCurrentLearner() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (cancelled) return;

        if (response.status === 401) {
          posthog.reset();
          return;
        }

        if (!response.ok) return;

        const payload = (await response.json()) as ApiEnvelope<MeResponse>;
        if (cancelled || payload.error || !payload.data) return;

        const profile = payload.data;
        posthog.identify(profile.id, {
          roles: profile.roles,
          target_band: profile.targetBand,
          exam_date: profile.examDate,
          native_language: profile.nativeLanguage,
          study_goal: profile.studyGoal,
        });
      } catch {
        // Analytics identity should never affect application rendering.
      }
    }

    void identifyCurrentLearner();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
