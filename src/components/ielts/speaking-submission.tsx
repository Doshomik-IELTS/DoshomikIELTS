"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";
import { SpeakingRecorder } from "./speaking-recorder";

type SpeakingSubmissionProps = {
  attemptId: string;
  sectionId: string;
  part: string;
  onSubmitted?: (evaluationId: string) => void;
};

type SubmissionResponse = {
  id: string;
  status: string;
};

export function SpeakingSubmission({
  attemptId,
  sectionId,
  part,
  onSubmitted,
}: SpeakingSubmissionProps) {
  const [text, setText] = useState("");
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim() && !mediaAssetId) {
      setError("Please provide either a text response or record audio");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch<SubmissionResponse>("/api/evaluations/speaking", {
        method: "POST",
        body: JSON.stringify({
          attemptId,
          sectionId,
          part,
          responseText: text.trim() || null,
          mediaAssetId: mediaAssetId || null,
        }),
      });

      if (!res.id) {
        throw new Error("Submission failed");
      }

      onSubmitted?.(res.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="response">Your Response</Label>
        <Textarea
          id="response"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your response here..."
          rows={6}
          disabled={submitting}
        />
        <p className="text-xs text-slate-500">
          Or record your response using the audio recorder below.
        </p>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <Label>Audio Recording</Label>
        <SpeakingRecorder
          onRecordingComplete={(id) => setMediaAssetId(id)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Response"}
        </Button>
      </div>
    </div>
  );
}