"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

type SpeakingRecorderProps = {
  disabled?: boolean;
  onRecordingComplete?: (mediaAssetId: string | null) => void;
};

type UploadResponse = {
  mediaAssetId: string;
  signedUrl: string;
  token: string;
  expiresIn: number;
};

const PREFERRED_AUDIO_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"];

export function SpeakingRecorder({ disabled = false, onRecordingComplete }: SpeakingRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [contentType, setContentType] = useState("audio/webm");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser cannot access the microphone. Use a typed response instead.");
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error("Audio recording is not supported in this browser. Use a typed response instead.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedMimeType = getSupportedMimeType();
      const mediaRecorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);
      const normalizedType = normalizeAudioContentType(mediaRecorder.mimeType || supportedMimeType || "audio/webm");

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setContentType(normalizedType);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blobType = normalizeAudioContentType(
          chunksRef.current.at(-1)?.type || mediaRecorder.mimeType || normalizedType,
        );
        const blob = new Blob(chunksRef.current, { type: blobType });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecorded(true);
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

  async function uploadAudio() {
    const blob = blobRef.current;
    if (!blob) {
      setError("No recording to upload");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadRes = await apiFetch<UploadResponse>("/api/media/upload-url", {
        method: "POST",
        body: JSON.stringify({
          purpose: "speaking_recording",
          contentType,
          sizeBytes: blob.size,
        }),
      });

      const uploadRes2 = await fetch(uploadRes.signedUrl, {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: blob,
      });

      if (!uploadRes2.ok) {
        throw new Error(`Upload failed with status ${uploadRes2.status}`);
      }

      setMediaAssetId(uploadRes.mediaAssetId);
      onRecordingComplete?.(uploadRes.mediaAssetId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play();
      setPlaying(true);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {!recorded ? (
          <>
            {!recording ? (
              <Button onClick={startRecording} disabled={uploading || disabled} aria-label="Start audio recording">
                Start Recording
              </Button>
            ) : (
              <Button variant="outline" onClick={stopRecording} disabled={disabled} aria-label="Stop audio recording">
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
              onRecordingComplete?.(null);
              if (audioUrl) URL.revokeObjectURL(audioUrl);
              setAudioUrl(null);
              blobRef.current = null;
            }}
            disabled={disabled || uploading}
            aria-label="Record audio again"
          >
            Record Again
          </Button>
        )}
      </div>

      {recording && (
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm text-red-600">Recording...</span>
        </div>
      )}

      {recorded && audioUrl && (
        <div className="space-y-2">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setPlaying(false)}
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayback}
              disabled={uploading || disabled}
              aria-label={playing ? "Stop audio playback" : "Play recording preview"}
            >
              {playing ? "Stop" : "Play Preview"}
            </Button>
            {!mediaAssetId && (
              <Button onClick={uploadAudio} disabled={uploading || disabled} aria-label="Upload audio recording">
                {uploading ? "Uploading..." : "Upload Recording"}
              </Button>
            )}
          </div>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <span className="h-3 w-3 animate-pulse rounded-full bg-amber-500" />
          <span className="text-sm text-amber-600">Uploading...</span>
        </div>
      )}

      {recorded && mediaAssetId && (
        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm text-green-600">Recording uploaded</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return null;
  }

  return PREFERRED_AUDIO_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? null;
}

function normalizeAudioContentType(value: string) {
  if (value.startsWith("audio/webm")) {
    return "audio/webm";
  }
  if (value.startsWith("audio/mp4") || value.startsWith("audio/x-m4a")) {
    return "audio/mp4";
  }
  if (value.startsWith("audio/mpeg") || value.startsWith("audio/mp3")) {
    return "audio/mpeg";
  }
  if (value.startsWith("audio/wav") || value.startsWith("audio/wave")) {
    return "audio/wav";
  }
  return "audio/webm";
}
