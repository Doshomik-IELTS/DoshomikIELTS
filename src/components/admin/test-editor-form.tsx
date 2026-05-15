"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api/client";

type Module = "listening" | "reading" | "writing" | "speaking";
type Step = "setup" | "template" | "source" | "review";
type Template = "full_academic" | "module_only" | "short_diagnostic" | "custom";
type SourceStrategy = "blank" | "duplicate" | "import" | "generate";

const MODULES: { value: Module; label: string; duration: number; sections: { title: string; partNumber: number; duration: number }[] }[] = [
  {
    value: "listening",
    label: "Listening",
    duration: 30,
    sections: [
      { title: "Listening Part 1 - Conversation", partNumber: 1, duration: 8 },
      { title: "Listening Part 2 - Monologue", partNumber: 2, duration: 8 },
      { title: "Listening Part 3 - Discussion", partNumber: 3, duration: 7 },
      { title: "Listening Part 4 - Lecture", partNumber: 4, duration: 7 },
    ],
  },
  {
    value: "reading",
    label: "Reading",
    duration: 60,
    sections: [
      { title: "Reading Passage 1", partNumber: 1, duration: 20 },
      { title: "Reading Passage 2", partNumber: 2, duration: 20 },
      { title: "Reading Passage 3", partNumber: 3, duration: 20 },
    ],
  },
  {
    value: "writing",
    label: "Writing",
    duration: 60,
    sections: [
      { title: "Writing Task 1 - Academic Report", partNumber: 1, duration: 20 },
      { title: "Writing Task 2 - Essay", partNumber: 2, duration: 40 },
    ],
  },
  {
    value: "speaking",
    label: "Speaking",
    duration: 15,
    sections: [
      { title: "Speaking Part 1 - Interview", partNumber: 1, duration: 5 },
      { title: "Speaking Part 2 - Long Turn", partNumber: 2, duration: 4 },
      { title: "Speaking Part 3 - Discussion", partNumber: 3, duration: 6 },
    ],
  },
];

const STEPS: Step[] = ["setup", "template", "source", "review"];

function selectedModulesForTemplate(template: Template, moduleOnly: Module) {
  if (template === "full_academic") return MODULES.map((module) => module.value);
  if (template === "module_only") return [moduleOnly];
  if (template === "short_diagnostic") return ["listening", "reading", "writing", "speaking"] as Module[];
  return [] as Module[];
}

export function TestEditorForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("setup");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testMode, setTestMode] = useState("strict_simulation");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [topicTags, setTopicTags] = useState("");
  const [template, setTemplate] = useState<Template>("full_academic");
  const [moduleOnly, setModuleOnly] = useState<Module>("reading");
  const [customModules, setCustomModules] = useState<Set<Module>>(new Set(["reading"]));
  const [sourceStrategy, setSourceStrategy] = useState<SourceStrategy>("blank");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function modules() {
    if (template === "custom") return Array.from(customModules);
    return selectedModulesForTemplate(template, moduleOnly);
  }

  function sections() {
    if (template === "short_diagnostic") {
      return modules().map((module, index) => ({
        title: `${MODULES.find((item) => item.value === module)?.label ?? module} Diagnostic`,
        module,
        partNumber: 1,
        durationMinutes: module === "speaking" ? 5 : 15,
        orderIndex: index,
      }));
    }

    return modules().flatMap((module) => {
      const def = MODULES.find((item) => item.value === module);
      return (def?.sections ?? []).map((section) => ({
        title: section.title,
        module,
        partNumber: section.partNumber,
        durationMinutes: section.duration,
      }));
    });
  }

  function duration() {
    if (template === "short_diagnostic") return modules().reduce((sum, module) => sum + (module === "speaking" ? 5 : 15), 0);
    return modules().reduce((sum, module) => sum + (MODULES.find((item) => item.value === module)?.duration ?? 0), 0);
  }

  function go(next: Step) {
    if (step === "setup" && !title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setStep(next);
  }

  function toggleCustomModule(module: Module) {
    setCustomModules((current) => {
      const next = new Set(current);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  async function createTest() {
    if (!title.trim()) {
      setError("Title is required.");
      setStep("setup");
      return;
    }
    if (modules().length === 0) {
      setError("Select at least one module.");
      setStep("template");
      return;
    }
    if (sourceStrategy !== "blank") {
      setError("Use the Tests page import, duplicate, or generation panels for that source strategy.");
      setStep("source");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await apiFetch<{ id: string }>("/api/admin/tests", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: [
            description.trim(),
            `Mode: ${testMode}`,
            `Difficulty target: ${difficulty}`,
            topicTags.trim() ? `Tags: ${topicTags.trim()}` : "",
          ].filter(Boolean).join("\n"),
          type: modules().length === 4 && template === "full_academic" ? "full_mock" : "short_mock",
          estimatedDurationMinutes: duration(),
          sections: sections().map((section, index) => ({
            ...section,
            orderIndex: index,
            instructions: "Add learner-facing instructions before publishing.",
            contentJson: {
              setup: {
                ieltsVersion: "academic",
                mode: testMode,
                difficultyTarget: difficulty,
                topicTags: topicTags.split(",").map((tag) => tag.trim()).filter(Boolean),
                template,
              },
            },
          })),
        }),
      });

      router.push(`/admin/tests/${res.id}/builder`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create test");
    } finally {
      setCreating(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);
  const currentSections = sections();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-500">Step {stepIndex + 1} of {STEPS.length}</p>
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((item, index) => (
            <div key={item} className={`h-1 rounded-full ${index <= stepIndex ? "bg-blue-600" : "bg-slate-200"}`} />
          ))}
        </div>
      </div>

      {step === "setup" && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="IELTS Academic Mock Test 1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <select id="mode" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={testMode} onChange={(e) => setTestMode(e.target.value)}>
                  <option value="strict_simulation">Strict simulation</option>
                  <option value="timed">Timed practice</option>
                  <option value="untimed">Untimed practice</option>
                  <option value="diagnostic">Diagnostic</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Internal description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose, source notes, review notes, or internal target audience." rows={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty target</Label>
                <select id="difficulty" className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Topic tags</Label>
                <Input id="tags" value={topicTags} onChange={(e) => setTopicTags(e.target.value)} placeholder="education, cities, environment" />
              </div>
            </div>
            <Button onClick={() => go("template")}>Continue</Button>
          </CardContent>
        </Card>
      )}

      {step === "template" && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["full_academic", "Full Academic mock", "Listening, Reading, Writing, and Speaking with official-style parts."],
                ["module_only", "Module-only test", "Build one complete skill test."],
                ["short_diagnostic", "Short diagnostic", "One compact section per module."],
                ["custom", "Custom", "Choose the modules manually."],
              ].map(([value, label, help]) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded border p-4 text-left ${template === value ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                  onClick={() => setTemplate(value as Template)}
                >
                  <p className="font-medium text-slate-900">{label}</p>
                  <p className="mt-1 text-sm text-slate-500">{help}</p>
                </button>
              ))}
            </div>

            {template === "module_only" && (
              <div className="space-y-2">
                <Label>Module</Label>
                <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={moduleOnly} onChange={(e) => setModuleOnly(e.target.value as Module)}>
                  {MODULES.map((module) => <option key={module.value} value={module.value}>{module.label}</option>)}
                </select>
              </div>
            )}

            {template === "custom" && (
              <div className="grid gap-2 sm:grid-cols-4">
                {MODULES.map((module) => (
                  <label key={module.value} className="flex items-center gap-2 rounded border border-slate-200 p-3 text-sm">
                    <input type="checkbox" checked={customModules.has(module.value)} onChange={() => toggleCustomModule(module.value)} />
                    {module.label}
                  </label>
                ))}
              </div>
            )}

            <div className="rounded bg-slate-50 p-4 text-sm text-slate-600">
              {modules().length} module(s), {currentSections.length} section(s), approximately {duration()} minutes.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("setup")}>Back</Button>
              <Button onClick={() => go("source")}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "source" && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["blank", "Start blank", "Create the selected structure and author content in the builder."],
                ["duplicate", "Duplicate existing", "Use Duplicate Draft from an existing test row or builder."],
                ["import", "Import JSON", "Use the import panel on the Tests page for structured content."],
                ["generate", "Generate draft", "Create a generation job from the Tests page and review it before import."],
              ].map(([value, label, help]) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded border p-4 text-left ${sourceStrategy === value ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                  onClick={() => setSourceStrategy(value as SourceStrategy)}
                >
                  <p className="font-medium text-slate-900">{label}</p>
                  <p className="mt-1 text-sm text-slate-500">{help}</p>
                </button>
              ))}
            </div>
            {sourceStrategy !== "blank" ? (
              <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                This wizard creates blank structured tests. For this source strategy, go to the Tests page after closing this form.
                <div className="mt-3">
                  <Link href="/admin/tests"><Button variant="outline">Open Tests page</Button></Link>
                </div>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("template")}>Back</Button>
              <Button onClick={() => go("review")}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-500">{template.replace("_", " ")} - {difficulty} - {testMode.replace("_", " ")}</p>
            </div>
            <div className="divide-y rounded border border-slate-200">
              {currentSections.map((section, index) => (
                <div key={`${section.module}-${section.partNumber}-${index}`} className="flex items-center justify-between p-3 text-sm">
                  <span>{section.title}</span>
                  <span className="text-slate-500">{section.durationMinutes} min</span>
                </div>
              ))}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("source")}>Back</Button>
              <Button onClick={createTest} disabled={creating || sourceStrategy !== "blank"}>{creating ? "Creating..." : "Create test"}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
