"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api/client";

type Section = {
  id: string;
  module: string;
  partNumber: number | null;
  title: string;
  instructions: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  questionCount: number;
};

type TestSectionEditorProps = {
  testId: string;
  sections: Section[];
  onSectionsChange?: (sections: Section[]) => void;
};

export function TestSectionEditor({ testId, sections, onSectionsChange }: TestSectionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function addSection() {
    if (!newSectionTitle.trim()) return;
    setAdding(true);

    try {
      const res = await apiFetch<{ id: string }>(`/api/admin/tests/${testId}/sections`, {
        method: "POST",
        body: JSON.stringify({
          title: newSectionTitle.trim(),
          module: "listening",
          orderIndex: sections.length,
        }),
      });

      const newSection: Section = {
        id: res.id,
        module: "listening",
        partNumber: null,
        title: newSectionTitle.trim(),
        instructions: null,
        durationMinutes: null,
        orderIndex: sections.length,
        questionCount: 0,
      };

      onSectionsChange?.([...sections, newSection]);
      setNewSectionTitle("");
    } catch (e) {
      console.error("Failed to add section:", e);
    } finally {
      setAdding(false);
    }
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("Delete this section?")) return;

    try {
      await apiFetch(`/api/admin/tests/${testId}/sections/${sectionId}`, {
        method: "DELETE",
      });
      onSectionsChange?.(sections.filter((s) => s.id !== sectionId));
    } catch (e) {
      console.error("Failed to delete section:", e);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Sections ({sections.length})</h3>

      {sections.length === 0 ? (
        <p className="text-sm text-slate-500">No sections yet.</p>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between rounded border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium">{section.title}</p>
                <p className="text-sm text-slate-500">
                  {section.module} • {section.questionCount} questions
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingId(editingId === section.id ? null : section.id)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSection(section.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title"
        />
        <Button onClick={addSection} disabled={adding || !newSectionTitle.trim()}>
          {adding ? "Adding..." : "Add Section"}
        </Button>
      </div>
    </div>
  );
}