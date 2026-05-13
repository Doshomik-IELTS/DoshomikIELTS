"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";

type Module = "listening" | "reading" | "writing" | "speaking";

const MODULES: { value: Module; label: string; description: string; sections: { title: string; partNumber: number; duration: number }[] }[] = [
  {
    value: "listening",
    label: "Listening",
    description: "4 sections — conversation, monologue, map/table/form fill. 30 minutes audio.",
    sections: [
      { title: "Listening Part 1 — Conversation", partNumber: 1, duration: 8 },
      { title: "Listening Part 2 — Monologue", partNumber: 2, duration: 8 },
      { title: "Listening Part 3 — Conversation", partNumber: 3, duration: 7 },
      { title: "Listening Part 4 — Monologue", partNumber: 4, duration: 7 },
    ],
  },
  {
    value: "reading",
    label: "Reading",
    description: "3 passages, 40 questions total. Academic or General Training. 60 minutes.",
    sections: [
      { title: "Reading Passage 1", partNumber: 1, duration: 20 },
      { title: "Reading Passage 2", partNumber: 2, duration: 20 },
      { title: "Reading Passage 3", partNumber: 3, duration: 20 },
    ],
  },
  {
    value: "writing",
    label: "Writing",
    description: "Task 1 (graph/chart) + Task 2 (essay). 60 minutes total.",
    sections: [
      { title: "Writing Task 1 — Task Achievement", partNumber: 1, duration: 20 },
      { title: "Writing Task 2 — Essay", partNumber: 2, duration: 40 },
    ],
  },
  {
    value: "speaking",
    label: "Speaking",
    description: "Parts 1–3: interview, long turn, discussion. 11–14 minutes.",
    sections: [
      { title: "Speaking Part 1 — Introduction", partNumber: 1, duration: 5 },
      { title: "Speaking Part 2 — Long Turn", partNumber: 2, duration: 4 },
      { title: "Speaking Part 3 — Discussion", partNumber: 3, duration: 6 },
    ],
  },
];

const TOTAL_DURATION: Record<Module, number> = {
  listening: 30,
  reading: 60,
  writing: 60,
  speaking: 15,
};

type Step = "metadata" | "modules";

export function TestEditorForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("metadata");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("175");
  const [selectedModules, setSelectedModules] = useState<Set<Module>>(new Set(["listening", "reading", "writing", "speaking"]));
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleModule(m: Module) {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(m)) {
        next.delete(m);
      } else {
        next.add(m);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedModules(new Set(["listening", "reading", "writing", "speaking"]));
  }

  function selectNone() {
    setSelectedModules(new Set());
  }

  function calculateDuration() {
    let total = 0;
    for (const m of selectedModules) {
      total += TOTAL_DURATION[m];
    }
    return total;
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (selectedModules.size === 0) {
      setError("Select at least one module");
      return;
    }
    setCreating(true);
    setError(null);

    try {
      const sections: { title: string; module: Module; partNumber: number; durationMinutes: number }[] = [];
      for (const m of selectedModules) {
        const def = MODULES.find((d) => d.value === m)!;
        for (const s of def.sections) {
          sections.push({ title: s.title, module: m, partNumber: s.partNumber, durationMinutes: s.duration });
        }
      }

      const testType = selectedModules.size === 4 ? "full_mock" : "short_mock";
      const duration = calculateDuration();

      const res = await apiFetch<{ id: string }>("/api/admin/tests", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          type: testType,
          estimatedDurationMinutes: duration,
          sections,
        }),
      });

      router.push(`/admin/tests/${res.id}/builder`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create test");
    } finally {
      setCreating(false);
    }
  }

  const selectedCount = selectedModules.size;
  const sectionCount = MODULES
    .filter((m) => selectedModules.has(m.value))
    .reduce((acc, m) => acc + m.sections.length, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Create IELTS Test</h1>
        <p className="text-sm text-slate-500">
          Step {step === "metadata" ? "1" : "2"} of 2 —{" "}
          {step === "metadata" ? "Test details" : "Select modules"}
        </p>
        <div className="mt-2 flex gap-1">
          <div className={`h-1 flex-1 rounded-full ${step === "metadata" ? "bg-blue-600" : "bg-slate-200"}`} />
          <div className={`h-1 flex-1 rounded-full ${step === "modules" ? "bg-blue-600" : "bg-slate-200"}`} />
        </div>
      </div>

      {step === "metadata" ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Test title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. IELTS Academic Practice Test 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this test"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Estimated duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="175"
            />
            <p className="text-xs text-slate-400">
              Full mock = ~175 min. Adjust based on selected modules.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                if (!title.trim()) { setError("Title is required"); return; }
                setError(null);
                setStep("modules");
              }}
            >
              Continue →
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{title}</p>
            <p className="text-sm text-slate-500">
              {selectedCount} module{selectedCount !== 1 ? "s" : ""} · {sectionCount} section{sectionCount !== 1 ? "s" : ""} · ~{calculateDuration()} min
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Modules to include</Label>
              <div className="flex gap-2 text-xs">
                <button type="button" onClick={selectAll} className="text-blue-600 hover:underline">Select all</button>
                <span className="text-slate-300">|</span>
                <button type="button" onClick={selectNone} className="text-slate-500 hover:underline">Clear</button>
              </div>
            </div>

            {MODULES.map((m) => {
              const isSelected = selectedModules.has(m.value);
              return (
                <Card
                  key={m.value}
                  className={`cursor-pointer transition-colors ${isSelected ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                  onClick={() => toggleModule(m.value)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleModule(m.value)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{m.label}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{m.description}</p>
                      {isSelected && (
                        <ul className="mt-2 space-y-1">
                          {m.sections.map((s) => (
                            <li key={s.partNumber} className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-300" />
                              {s.title} · {s.duration} min
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-xs font-medium text-blue-600 whitespace-nowrap">
                        {m.sections.length} section{m.sections.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep("metadata")}>
              ← Back
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : `Create Test (${sectionCount} sections)`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
