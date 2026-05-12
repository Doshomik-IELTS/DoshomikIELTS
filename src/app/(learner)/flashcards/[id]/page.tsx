"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type Progress = {
  totalCards: number;
  dueToday: number;
  reviewedByUser: number;
  masteryPercent: number;
};

export default function FlashcardDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const [deckId, setDeckId] = useState("");
  useEffect(() => { params.then(p => setDeckId(p.id)); }, [params]);

  type DeckDetail = { id: string; title: string; description: string | null; category: string; difficulty: string; cards: { id: string; front: string; back: string; difficulty: string }[] };

  const { data: deck, isLoading } = useQuery<DeckDetail>({
    queryKey: ["flashcard-deck", deckId],
    queryFn: () => apiFetch(`/api/flashcards/decks/${deckId}`),
    enabled: !!deckId,
  });

  const { data: progress } = useQuery<Progress>({
    queryKey: ["flashcard-progress", deckId],
    queryFn: () => apiFetch(`/api/flashcards/decks/${deckId}/progress`),
    enabled: !!deckId,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>Deck not found.</p>
        <Link href="/flashcards"><Button className="mt-4" variant="outline">Back to Flashcards</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/flashcards" className="text-sm text-blue-600 hover:underline">← Flashcards</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{deck.title}</h1>
          {deck.description && <p className="mt-1 text-slate-500">{deck.description}</p>}
          <div className="mt-2 flex gap-2">
            <Badge variant="neutral" className="capitalize">{deck.category}</Badge>
            <Badge variant="neutral" className="capitalize">{deck.difficulty}</Badge>
            <span className="text-sm text-slate-400">{deck.cards.length} cards</span>
          </div>
        </div>
        <Link href={`/flashcards/${deckId}/study`}>
          <Button size="lg">Start Studying</Button>
        </Link>
      </div>

      {progress && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{progress.totalCards}</p>
              <p className="text-xs text-slate-500">Total Cards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{progress.dueToday}</p>
              <p className="text-xs text-slate-500">Due Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{progress.reviewedByUser}</p>
              <p className="text-xs text-slate-500">Cards Reviewed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{progress.masteryPercent}%</p>
              <p className="text-xs text-slate-500">Mastery</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-semibold text-slate-900">Preview ({deck.cards.length} cards)</h2>
        <div className="space-y-2">
          {deck.cards.slice(0, 10).map((card: { id: string; front: string; back: string; difficulty: string }, idx: number) => (
            <Card key={card.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{card.front}</p>
                  <p className="text-xs text-slate-400 truncate">{card.back}</p>
                </div>
                <Badge variant="neutral" className="capitalize text-xs">{card.difficulty}</Badge>
              </CardContent>
            </Card>
          ))}
          {deck.cards.length > 10 && (
            <p className="text-center text-sm text-slate-400 py-2">
              + {deck.cards.length - 10} more cards
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
