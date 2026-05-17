"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import type { IeltsModule, TestType } from "@prisma/client";

type GenerationJob = {
  id: string;
  module: IeltsModule;
  testType: TestType;
  status: string;
  createdAt: string;
};

export function TestGenerationPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [module, setModule] = useState<IeltsModule>("reading");
  const [testType, setTestType] = useState<TestType>("short_mock");
  const [blueprint, setBlueprint] = useState("");
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [outputJson, setOutputJson] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function createJob() {
    setError(null);
    setSaving(true);
    try {
      const blueprintJson = blueprint.trim() ? JSON.parse(blueprint) as Record<string, unknown> : undefined;
      const result = await apiFetch<{ job: GenerationJob }>("/api/admin/generation/tests", {
        method: "POST",
        body: JSON.stringify({ module, testType, blueprintJson }),
      });
      setJob(result.job);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError("Invalid JSON in blueprint. Check your syntax.");
        return;
      }
      setError(e instanceof Error ? e.message : "Could not create generation job");
    } finally {
      setSaving(false);
    }
  }

  async function saveOutput(status: "review" | "archived") {
    if (!job) return;
    setError(null);
    setSaving(true);
    try {
      const output = outputJson.trim() ? JSON.parse(outputJson) as Record<string, unknown> : undefined;
      const result = await apiFetch<{ job: GenerationJob }>(`/api/admin/generation/tests/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, outputJson: output }),
      });
      setJob(result.job);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError("Invalid JSON in output. Check your syntax.");
        return;
      }
      setError(e instanceof Error ? e.message : "Could not update generation job");
    } finally {
      setSaving(false);
    }
  }

  async function importDraft() {
    if (!job) return;
    setError(null);
    setSaving(true);
    try {
      await saveOutput("review");
      const result = await apiFetch<{ test: { id: string } }>(`/api/admin/generation/tests/${job.id}/import-draft`, {
        method: "POST",
      });
      router.push(`/admin/tests/${result.test.id}/builder`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not import generated draft");
    } finally {
      setSaving(false);
    }
  }

  async function generateLocalDraft() {
    if (!job) return;
    setError(null);
    setSaving(true);
    try {
      const result = await apiFetch<{ job: GenerationJob & { outputJson?: unknown } }>(`/api/admin/generation/tests/${job.id}/generate-draft`, {
        method: "POST",
      });
      setJob(result.job);
      setOutputJson(JSON.stringify(result.job.outputJson ?? {}, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate local draft");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return <Button type="button" variant="outline" onClick={() => setOpen(true)}>Start generation job</Button>;
  }

  return (
    <div className="space-y-3 rounded border border-slate-200 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500" htmlFor="generation-module">
            Module
          </label>
          <select
            id="generation-module"
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={module}
            onChange={(e) => setModule(e.target.value as IeltsModule)}
          >
            <option value="listening">Listening</option>
            <option value="reading">Reading</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500" htmlFor="generation-test-type">
            Test type
          </label>
          <select
            id="generation-test-type"
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={testType}
            onChange={(e) => setTestType(e.target.value as TestType)}
          >
            <option value="practice">Practice</option>
            <option value="short_mock">Short mock</option>
            <option value="full_mock">Full mock</option>
          </select>
        </div>
      </div>
      <Textarea
        rows={5}
        value={blueprint}
        onChange={(e) => setBlueprint(e.target.value)}
        placeholder='Optional blueprint JSON, for example {"topic":"urban transport","difficulty":"intermediate"}'
        className="font-mono text-xs"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {job ? (
        <div className="space-y-3 rounded bg-slate-50 p-3">
          <p className="text-sm text-slate-600">
            Generation job {job.id} is in {job.status} status.
          </p>
          <Textarea
            rows={8}
            value={outputJson}
            onChange={(e) => setOutputJson(e.target.value)}
            placeholder='Paste reviewed generated test JSON here, then import it as a draft.'
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={generateLocalDraft} disabled={saving}>Generate local draft</Button>
            <Button type="button" variant="outline" onClick={() => saveOutput("review")} disabled={saving || !outputJson.trim()}>Save for review</Button>
            <Button type="button" onClick={importDraft} disabled={saving || !outputJson.trim()}>Import as draft</Button>
            <Button type="button" variant="outline" onClick={() => saveOutput("archived")} disabled={saving}>Reject</Button>
          </div>
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" onClick={createJob} disabled={saving}>{saving ? "Starting..." : "Create job"}</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
      </div>
    </div>
  );
}
