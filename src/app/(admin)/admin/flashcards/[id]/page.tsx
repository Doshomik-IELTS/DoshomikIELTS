"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type Card = {
  id: string;
  front: string;
  back: string;
  examples: string[];
  hints: string[];
  difficulty: string;
  orderIndex: number;
  interval: number;
  repetitions: number;
};

type DeckDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  tags: string[];
  status: string;
  publishedAt: string | null;
  cards: Card[];
};

const CATEGORIES = ["vocabulary", "grammar", "listening", "reading", "writing", "speaking"];

export default function AdminFlashcardDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const qc = useQueryClient();
  const [deckId, setDeckId] = useState("");
  useEffect(() => { params.then(p => setDeckId(p.id)); }, [params]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");
  const [savingDeck, setSavingDeck] = useState(false);

  const [addingCard, setAddingCard] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newExamples, setNewExamples] = useState("");
  const [newHints, setNewHints] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("intermediate");
  const [creatingCard, setCreatingCard] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Card>>({});

  const { data: deck, isLoading } = useQuery<DeckDetail>({
    queryKey: ["admin-flashcard-deck", deckId],
    queryFn: () => apiFetch(`/api/admin/flashcards/decks/${deckId}`),
    enabled: !!deckId,
  });

  useEffect(() => {
    if (deck) {
      setTitle(deck.title);
      setDescription(deck.description ?? "");
      setCategory(deck.category);
      setDifficulty(deck.difficulty);
      setTags(deck.tags.join(", "));
      setStatus(deck.status);
    }
  }, [deck]);

  const saveDeckMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/admin/flashcards/decks/${deckId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-flashcard-deck", deckId] }),
  });

  const createCardMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/api/admin/flashcards/decks/${deckId}/cards`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flashcard-deck", deckId] });
      setAddingCard(false);
      setNewFront(""); setNewBack(""); setNewExamples(""); setNewHints("");
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/admin/flashcards/cards/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flashcard-deck", deckId] });
      setEditingId(null);
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/admin/flashcards/cards/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-flashcard-deck", deckId] }),
  });

  async function saveDeck() {
    setSavingDeck(true);
    try {
      await saveDeckMutation.mutateAsync({
        title,
        description: description || null,
        category,
        difficulty,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        status,
      });
    } finally {
      setSavingDeck(false);
    }
  }

  async function createCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    setCreatingCard(true);
    try {
      await createCardMutation.mutateAsync({
        front: newFront.trim(),
        back: newBack.trim(),
        examples: newExamples.split("\n").map(s => s.trim()).filter(Boolean),
        hints: newHints.split("\n").map(s => s.trim()).filter(Boolean),
        difficulty: newDifficulty,
      });
    } finally {
      setCreatingCard(false);
    }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  if (!deck) return <div className="py-20 text-center text-slate-500">Deck not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/admin/flashcards" className="text-sm text-blue-600 hover:underline">← Flash Cards</Link>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Deck Settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Category</label>
              <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Difficulty</label>
              <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="basic">Easy</option>
                <option value="intermediate">Medium</option>
                <option value="advanced">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Status</label>
              <select className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="review">In Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium">Tags (comma-separated)</label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="ielts, band-7, vocabulary" />
            </div>
          </div>
          <Button onClick={saveDeck} disabled={savingDeck}>{savingDeck ? "Saving..." : "Save Settings"}</Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Cards ({deck.cards.length})</h2>
        <Button size="sm" onClick={() => setAddingCard(a => !a)}>
          {addingCard ? "Cancel" : "+ Add Card"}
        </Button>
      </div>

      {addingCard && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">New Card</h3>
            <form onSubmit={createCard} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Front (question/prompt)</label>
                  <Textarea value={newFront} onChange={e => setNewFront(e.target.value)} placeholder="Word or question" rows={2} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Back (answer/definition)</label>
                  <Textarea value={newBack} onChange={e => setNewBack(e.target.value)} placeholder="Answer or definition" rows={2} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Examples (one per line)</label>
                  <Textarea value={newExamples} onChange={e => setNewExamples(e.target.value)} placeholder="Example sentence&#10;Another example" rows={3} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Hints (one per line)</label>
                  <Textarea value={newHints} onChange={e => setNewHints(e.target.value)} placeholder="Hint 1&#10;Hint 2" rows={3} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Difficulty</label>
                  <select className="flex h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)}>
                    <option value="basic">Easy</option>
                    <option value="intermediate">Medium</option>
                    <option value="advanced">Hard</option>
                  </select>
                </div>
                <div className="flex-1" />
                <Button type="submit" disabled={creatingCard || !newFront.trim() || !newBack.trim()}>
                  {creatingCard ? "Adding..." : "Add Card"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {deck.cards.map(card => (
          <Card key={card.id}>
            <CardContent className="p-4">
              {editingId === card.id ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Textarea value={editForm.front ?? card.front} onChange={e => setEditForm(f => ({ ...f, front: e.target.value }))} rows={2} />
                    <Textarea value={editForm.back ?? card.back} onChange={e => setEditForm(f => ({ ...f, back: e.target.value }))} rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateCardMutation.mutate({ id: card.id, data: editForm })}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 truncate">{card.front}</p>
                      <span className="text-slate-300">→</span>
                      <p className="text-slate-600 truncate">{card.back}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="capitalize">{card.difficulty}</span>
                      <span>rep {card.repetitions}</span>
                      <span>int {card.interval}d</span>
                      {card.examples.length > 0 && <span>{card.examples.length} examples</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => { setEditingId(card.id); setEditForm({ front: card.front, back: card.back }); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { if (confirm("Delete this card?")) deleteCardMutation.mutate(card.id); }}>Delete</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {deck.cards.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-8 text-slate-500">
              No cards yet. Add your first card above.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
