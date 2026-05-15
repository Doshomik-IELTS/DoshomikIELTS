"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";

export function TestImportPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function importTest() {
    setError(null);
    setSaving(true);
    try {
      const payload = JSON.parse(text) as unknown;
      const result = await apiFetch<{ test: { id: string } }>("/api/admin/tests/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/admin/tests/${result.test.id}/builder`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return <Button type="button" variant="outline" onClick={() => setOpen(true)}>Import JSON</Button>;
  }

  return (
    <div className="space-y-3 rounded border border-slate-200 p-4">
      <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder='{"title":"Imported Test","sections":[...]}' className="font-mono text-xs" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" onClick={importTest} disabled={saving || !text.trim()}>{saving ? "Importing..." : "Import test"}</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
