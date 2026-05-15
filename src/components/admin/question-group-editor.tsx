"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import type { QuestionGroupData } from "./question-list-editor";

export function QuestionGroupEditor({
  sectionId,
  groups,
  onGroupsChange,
}: {
  sectionId: string;
  groups: QuestionGroupData[];
  onGroupsChange: (groups: QuestionGroupData[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [questionType, setQuestionType] = useState("completion");
  const [saving, setSaving] = useState(false);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);

  async function addGroup() {
    if (!title.trim() || !instructions.trim()) return;
    setSaving(true);
    try {
      const result = await apiFetch<{ group: QuestionGroupData }>("/api/admin/question-groups", {
        method: "POST",
        body: JSON.stringify({
          sectionId,
          title: title.trim(),
          instructions: instructions.trim(),
          questionType,
        }),
      });
      onGroupsChange([...groups, result.group]);
      setTitle("");
      setInstructions("");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: string) {
    await apiFetch(`/api/admin/question-groups/${id}`, { method: "DELETE" });
    onGroupsChange(groups.filter((group) => group.id !== id));
  }

  async function moveGroup(id: string, direction: -1 | 1) {
    const currentIndex = groups.findIndex((group) => group.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= groups.length) return;
    const next = [...groups];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(nextIndex, 0, moved);
    const reordered = next.map((group, index) => ({ ...group, orderIndex: index }));
    onGroupsChange(reordered);
    try {
      await apiFetch("/api/admin/question-groups/reorder", {
        method: "PATCH",
        body: JSON.stringify({ sectionId, groupIds: reordered.map((group) => group.id) }),
      });
    } catch (e) {
      console.error("Failed to reorder groups:", e);
      onGroupsChange(groups);
    }
  }

  async function reorderGroups(next: QuestionGroupData[]) {
    const reordered = next.map((group, index) => ({ ...group, orderIndex: index }));
    onGroupsChange(reordered);
    try {
      await apiFetch("/api/admin/question-groups/reorder", {
        method: "PATCH",
        body: JSON.stringify({ sectionId, groupIds: reordered.map((group) => group.id) }),
      });
    } catch (e) {
      console.error("Failed to reorder groups:", e);
      onGroupsChange(groups);
    }
  }

  async function dropGroup(targetGroupId: string) {
    if (!draggedGroupId || draggedGroupId === targetGroupId) return;
    const from = groups.findIndex((group) => group.id === draggedGroupId);
    const to = groups.findIndex((group) => group.id === targetGroupId);
    if (from < 0 || to < 0) return;
    const next = [...groups];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraggedGroupId(null);
    await reorderGroups(next);
  }

  return (
    <div className="space-y-4 rounded border border-slate-200 p-4">
      <div>
        <h3 className="font-semibold text-slate-800">Question Groups</h3>
        <p className="mt-1 text-sm text-slate-500">Use groups for IELTS blocks like Questions 1-6 or matching headings.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Questions 1-6" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Question type</Label>
          <Input value={questionType} onChange={(e) => setQuestionType(e.target.value)} placeholder="completion" />
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={addGroup} disabled={saving || !title.trim() || !instructions.trim()} className="w-full">
            {saving ? "Adding..." : "Add group"}
          </Button>
        </div>
      </div>
      <Textarea
        rows={2}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Complete the notes below. Write no more than two words and/or a number."
      />
      {groups.length > 0 && (
        <div className="space-y-2">
          {groups.map((group, index) => (
            <div
              key={group.id}
              draggable
              onDragStart={() => setDraggedGroupId(group.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropGroup(group.id)}
              className={`flex items-start justify-between gap-3 rounded bg-slate-50 p-3 text-sm ${draggedGroupId === group.id ? "ring-2 ring-blue-200" : ""}`}
            >
              <div>
                <p className="font-medium">{group.title}</p>
                <p className="text-slate-500">{group.instructions}</p>
              </div>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => moveGroup(group.id, -1)} disabled={index === 0}>Up</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => moveGroup(group.id, 1)} disabled={index === groups.length - 1}>Down</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => deleteGroup(group.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
