"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";

type MediaAsset = {
  id: string;
  title: string | null;
  path: string;
  purpose: string;
  contentType: string;
  durationSeconds: number | null;
};

export function MediaAssetPicker({
  value,
  onSelect,
}: {
  value: string | null;
  onSelect: (asset: MediaAsset) => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [licenseSource, setLicenseSource] = useState("original");
  const [licenseNote, setLicenseNote] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-media", query],
    queryFn: () => apiFetch<{ media: MediaAsset[] }>(`/api/admin/media?purpose=listening-audio&search=${encodeURIComponent(query)}`),
  });

  async function uploadFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const upload = await apiFetch<{ mediaAssetId: string; signedUrl: string }>("/api/media/upload-url", {
        method: "POST",
        body: JSON.stringify({
          purpose: "listening_audio",
          contentType: file.type,
          sizeBytes: file.size,
          licenseMetadata: {
            sourceType: licenseSource,
            note: licenseNote || "Admin uploaded listening audio",
            copyrightChecked: true,
          },
        }),
      });

      const uploadResponse = await fetch(upload.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("Storage upload failed");
      }

      const metadata = await apiFetch<{ media: MediaAsset }>(`/api/admin/media/${upload.mediaAssetId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title || file.name,
          altText: title || file.name,
        }),
      });
      onSelect(metadata.media);
      setTitle("");
      setLicenseNote("");
      setQuery("");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3 rounded border border-slate-200 p-3">
      <div className="space-y-3 rounded bg-slate-50 p-3">
        <div className="grid gap-2 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs">Audio title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Listening Part 1 audio" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Source</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={licenseSource}
              onChange={(e) => setLicenseSource(e.target.value)}
            >
              <option value="original">Original</option>
              <option value="tts_generated">TTS generated</option>
              <option value="licensed">Licensed</option>
              <option value="in_house_recorded">In-house recorded</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Upload</Label>
            <Input
              type="file"
              accept="audio/mpeg,audio/mp4,audio/wav"
              disabled={uploading}
              onChange={(e) => uploadFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <Input value={licenseNote} onChange={(e) => setLicenseNote(e.target.value)} placeholder="License/source note" />
        {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
        {uploading ? <p className="text-sm text-slate-500">Uploading audio...</p> : null}
      </div>
      <div className="flex gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listening audio" />
        <Button type="button" variant="outline" onClick={() => setQuery(search)}>Search</Button>
      </div>
      <p className="text-xs text-slate-500">Selected asset: {value || "none"}</p>
      {isLoading ? <p className="text-sm text-slate-500">Loading media...</p> : null}
      <div className="space-y-2">
        {(data?.media ?? []).map((asset) => (
          <button
            key={asset.id}
            type="button"
            className="block w-full rounded border border-slate-100 p-2 text-left text-sm hover:bg-slate-50"
            onClick={() => onSelect(asset)}
          >
            <span className="font-medium">{asset.title || asset.path}</span>
            <span className="ml-2 text-xs text-slate-500">{asset.contentType}{asset.durationSeconds ? ` · ${asset.durationSeconds}s` : ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
