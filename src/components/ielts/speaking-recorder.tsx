"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

type SpeakingRecorderProps = {
  onRecordingComplete?: (mediaAssetId: string) => void;
};

type UploadResponse = {
  mediaAssetId: string;
  signedUrl: string;
  token: string;
  expiresIn: number;
};

export function SpeakingRecorder({ onRecordingComplete }: SpeakingRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setRecording(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start recording");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  async function uploadAudio(blob: Blob) {
    setUploading(true);
    setError(null);

    try {
      const uploadRes = await apiFetch<UploadResponse>("/api/media/upload-url", {
        method: "POST",
        body: JSON.stringify({
          purpose: "speaking_recording",
          contentType: "audio/webm",
          sizeBytes: blob.size,
        }),
      });

      const uploadRes2 = await fetch(uploadRes.signedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "audio/webm",
          "x-upsert": "true",
        },
        body: blob,
      });

      if (!uploadRes2.ok) {
        throw new Error("Upload failed");
      }

      setMediaAssetId(uploadRes.mediaAssetId);
      setRecorded(true);
      onRecordingComplete?.(uploadRes.mediaAssetId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {!recorded ? (
          <>
            {!recording ? (
              <Button onClick={startRecording} disabled={uploading}>
                Start Recording
              </Button>
            ) : (
              <Button variant="outline" onClick={stopRecording}>
                Stop Recording
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setRecorded(false);
              setMediaAssetId(null);
            }}
          >
            Record Again
          </Button>
        )}
      </div>

      {recording && (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm text-red-600">Recording...</span>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-amber-500" />
          <span className="text-sm text-amber-600">Uploading...</span>
        </div>
      )}

      {recorded && mediaAssetId && (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm text-green-600">Recording saved</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}