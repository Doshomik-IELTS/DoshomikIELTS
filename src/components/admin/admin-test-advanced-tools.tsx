"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TestGenerationPanel } from "@/components/admin/test-generation-panel";
import { TestImportPanel } from "@/components/admin/test-import-panel";

export function AdminTestAdvancedTools() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">Advanced tools</p>
          <p className="text-sm text-slate-500">Use import or generation when you already have structured content.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      {open ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <TestImportPanel />
          <TestGenerationPanel />
        </div>
      ) : null}
    </div>
  );
}
