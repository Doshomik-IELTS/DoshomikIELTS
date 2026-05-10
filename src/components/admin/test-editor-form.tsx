"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";
import { TEST_TYPE_OPTIONS } from "@/lib/tests/constants";

export function TestEditorForm({
  initial,
  testId,
}: {
  initial?: {
    title: string;
    type: string;
    estimatedDurationMinutes: number | null;
  };
  testId?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(initial?.type ?? "short_mock");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(
    initial?.estimatedDurationMinutes?.toString() ?? ""
  );

  async function save() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type,
      };
      if (estimatedDurationMinutes.trim()) {
        const mins = parseInt(estimatedDurationMinutes.trim(), 10);
        if (!Number.isNaN(mins)) {
          body.estimatedDurationMinutes = mins;
        }
      }

      let res: Response;
      if (testId) {
        res = await apiFetch(`/api/admin/tests/${testId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        res = await apiFetch("/api/admin/tests", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Failed to save");
        return;
      }

      const id = testId ?? json.id;
      router.push(`/admin/tests/${id}`);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Test title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TEST_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Estimated duration (minutes)</Label>
        <Input
          id="duration"
          type="number"
          value={estimatedDurationMinutes}
          onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
          placeholder="e.g. 60"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : testId ? "Update" : "Create"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/tests")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}