"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type Deck = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  status: string;
  cardCount: number;
  publishedAt: string | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-100 text-red-700",
  review: "bg-yellow-100 text-yellow-700",
};

const CATEGORIES = ["vocabulary", "grammar", "listening", "reading", "writing", "speaking"];

export default function AdminFlashcardsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("vocabulary");
  const [newDifficulty, setNewDifficulty] = useState("intermediate");
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery<{ items: Deck[] }>({
    queryKey: ["admin-flashcard-decks", search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const qs = params.toString();
      return apiFetch(`/api/admin/flashcards/decks${qs ? `?${qs}` : ""}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/flashcards/decks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-flashcard-decks"] }),
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/api/admin/flashcards/decks", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          difficulty: newDifficulty,
        }),
      });
      qc.invalidateQueries({ queryKey: ["admin-flashcard-decks"] });
      setShowCreate(false);
      setNewTitle("");
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flash Cards</h1>
          <p className="mt-1 text-sm text-slate-500">Manage flashcard decks and cards.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New Deck</Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search decks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="flex h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : !data?.items.length ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-slate-500">
            No decks found. Create your first deck!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.items.map(deck => (
            <Card key={deck.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/flashcards/${deck.id}`} className="font-medium text-slate-900 hover:underline truncate">
                      {deck.title}
                    </Link>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[deck.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {deck.status}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-slate-500">
                    <span className="capitalize">{deck.category}</span>
                    <span>{deck.cardCount} cards</span>
                    <span>{new Date(deck.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link href={`/admin/flashcards/${deck.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => { if (confirm(`Delete "${deck.title}"?`)) deleteMutation.mutate(deck.id); }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Create Deck</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Deck title"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Difficulty</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    value={newDifficulty}
                    onChange={e => setNewDifficulty(e.target.value)}
                  >
                    <option value="basic">Easy</option>
                    <option value="intermediate">Medium</option>
                    <option value="advanced">Hard</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating || !newTitle.trim()}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
