"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";
import { TEST_TYPE_OPTIONS, TEST_STATUS_OPTIONS } from "@/lib/tests/constants";

type TestDetail = {
  id: string;
  title: string;
  type: string;
  status: string;
  estimatedDurationMinutes: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  sections: {
    id: string;
    module: string;
    partNumber: number | null;
    title: string;
    instructions: string | null;
    durationMinutes: number | null;
    orderIndex: number;
    questionCount: number;
  }[];
};

export function TestDetailEditor({ testId }: { testId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-test", testId],
    queryFn: () => apiFetch<TestDetail>(`/api/admin/tests/${testId}`),
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("short_mock");
  const [status, setStatus] = useState("draft");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState("");

  // Initialize state from data once loaded
  useState(() => {
    if (data) {
      setTitle(data.title);
      setType(data.type);
      setStatus(data.status);
      setEstimatedDurationMinutes(data.estimatedDurationMinutes?.toString() ?? "");
    }
  });

  async function save() {
    if (!title.trim()) {
      setSaveError("Title is required");
      return;
    }
    setSaving(true);
    setSaveError(null);

    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        type,
        status,
      };
      if (estimatedDurationMinutes.trim()) {
        const mins = parseInt(estimatedDurationMinutes.trim(), 10);
        if (!Number.isNaN(mins)) {
          body.estimatedDurationMinutes = mins;
        }
      }

      await apiFetch(`/api/admin/tests/${testId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTest() {
    if (!confirm("Delete this test? This cannot be undone.")) {
      return;
    }
    if (!confirm("Are you sure? Tests with attempts cannot be deleted.")) {
      return;
    }
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/tests/${testId}`, {
        method: "DELETE",
      });
      router.push("/admin/tests");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) {
    return <p className="text-slate-600">Loading…</p>;
  }

  if (error || !data) {
    return <p className="text-red-600">Could not load test.</p>;
  }

  // Initialize state from data
  if (!title && data) {
    setTitle(data.title);
    setType(data.type);
    setStatus(data.status);
    setEstimatedDurationMinutes(data.estimatedDurationMinutes?.toString() ?? "");
  }

  const canDelete = data.attemptCount === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Test title"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {TEST_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
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

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Sections ({data.sections.length})</h2>
        {data.sections.length === 0 ? (
          <p className="text-sm text-slate-500">No sections yet. Add sections via database.</p>
        ) : (
          <div className="space-y-2">
            {data.sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between rounded border border-slate-100 p-3"
              >
                <div>
                  <p className="font-medium">{section.title}</p>
                  <p className="text-sm text-slate-500">
                    {section.module} • {section.questionCount} questions
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500">
        <p>Attempts: {data.attemptCount}</p>
        <p>Created: {new Date(data.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(data.updatedAt).toLocaleString()}</p>
      </div>

      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/tests")}>
          Back to list
        </Button>
        {canDelete && (
          <Button variant="outline" onClick={deleteTest} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}