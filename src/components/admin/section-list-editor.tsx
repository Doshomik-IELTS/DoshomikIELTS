"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import type { IeltsModule } from "@prisma/client";
import { IELTS_MODULES, MODULE_DEFAULT_DURATION } from "@/lib/tests/ielts-types";

export type SectionData = {
  id: string;
  module: IeltsModule;
  title: string;
  partNumber: number | null;
  instructions: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  questionCount: number;
  contentJson: Record<string, unknown> | null;
  mediaAssetId: string | null;
};

type SectionEditorProps = {
  testId: string;
  sections: SectionData[];
  onSectionsChange?: (sections: SectionData[]) => void;
};

type EditingSection = Partial<Omit<SectionData, "id" | "questionCount"> & { id: string }>;

export function SectionListEditor({ testId, sections, onSectionsChange }: SectionEditorProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newModule, setNewModule] = useState<IeltsModule>("listening");
  const [newDuration, setNewDuration] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingSection>({});
  const [saving, setSaving] = useState(false);

  async function addSection() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const section = await apiFetch<SectionData>(`/api/admin/tests/${testId}/sections`, {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          module: newModule,
          durationMinutes: newDuration ? parseInt(newDuration, 10) : MODULE_DEFAULT_DURATION[newModule],
          partNumber: 1,
          orderIndex: sections.length,
        }),
      });
      onSectionsChange?.([...sections, section]);
      setNewTitle("");
      setNewDuration("");
    } catch (e) {
      console.error("Failed to add section:", e);
    } finally {
      setAdding(false);
    }
  }

  async function updateSection() {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await apiFetch<SectionData>(
        `/api/admin/tests/${testId}/sections?sectionId=${editingId}`,
        { method: "PATCH", body: JSON.stringify(editForm) },
      );
      onSectionsChange?.(sections.map((s) => s.id === editingId ? { ...s, ...updated } : s));
      setEditingId(null);
      setEditForm({});
    } catch (e) {
      console.error("Failed to update section:", e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("Delete this section and all its questions?")) return;
    try {
      await apiFetch(`/api/admin/tests/${testId}/sections?sectionId=${sectionId}`, { method: "DELETE" });
      onSectionsChange?.(sections.filter((s) => s.id !== sectionId));
    } catch (e) {
      console.error("Failed to delete section:", e);
    }
  }

  function startEdit(section: SectionData) {
    setEditingId(section.id);
    setEditForm({ ...section });
  }

  function moduleColor(module: string) {
    const found = IELTS_MODULES.find((m) => m.value === module);
    return found?.color ?? "text-slate-700";
  }

  function moduleLabel(module: string) {
    const found = IELTS_MODULES.find((m) => m.value === module);
    return found?.label ?? module;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-4 font-semibold">Add Section</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Section Title</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Listening Part 1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Module</Label>
            <select
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={newModule}
              onChange={(e) => setNewModule(e.target.value as IeltsModule)}
            >
              {IELTS_MODULES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Duration (min)</Label>
            <Input
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              placeholder={MODULE_DEFAULT_DURATION[newModule].toString()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addSection} disabled={adding || !newTitle.trim()} className="w-full">
              {adding ? "Adding..." : "Add Section"}
            </Button>
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-slate-500">No sections yet. Add sections above.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={section.id} className="rounded-lg border border-slate-200 bg-white">
              {editingId === section.id ? (
                <div className="space-y-3 p-4">
                  <h4 className="font-medium text-slate-700">Edit: {section.title}</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input value={editForm.title ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Module</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                        value={editForm.module ?? section.module}
                        onChange={(e) => setEditForm((f) => ({ ...f, module: e.target.value as IeltsModule }))}
                      >
                        {IELTS_MODULES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Part Number</Label>
                      <Input type="number" min={1} value={editForm.partNumber ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, partNumber: e.target.value ? parseInt(e.target.value, 10) : null }))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duration (minutes)</Label>
                      <Input type="number" min={1} value={editForm.durationMinutes ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: e.target.value ? parseInt(e.target.value, 10) : null }))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Instructions</Label>
                    <Textarea
                      value={editForm.instructions ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, instructions: e.target.value }))}
                      placeholder="Section instructions for the learner"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateSection} disabled={saving} size="sm">{saving ? "Saving..." : "Save"}</Button>
                    <Button onClick={() => setEditingId(null)} variant="outline" size="sm">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-sm text-slate-500">
                        <span className={`font-medium capitalize ${moduleColor(section.module)}`}>{moduleLabel(section.module)}</span>
                        {section.partNumber ? ` · Part ${section.partNumber}` : ""}
                        {section.durationMinutes ? ` · ${section.durationMinutes} min` : ""}
                        {" · "}{section.questionCount} question{section.questionCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(section)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteSection(section.id)} className="text-red-600">Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}