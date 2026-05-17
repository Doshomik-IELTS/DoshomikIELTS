"use client";

import posthog from "posthog-js";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export function isPostHogConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function captureLearnerEvent(event: string, properties: AnalyticsProperties = {}) {
  if (!isPostHogConfigured()) return;

  try {
    posthog.capture(event, properties);
  } catch {
    // Analytics should never interrupt learner workflows.
  }
}
