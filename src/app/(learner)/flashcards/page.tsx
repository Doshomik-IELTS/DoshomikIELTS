"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type Deck = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  tags: string[];
  cardCount: number;
};

const CATEGORIES = ["vocabulary", "grammar", "listening", "reading", "writing", "speaking"];

const DIFFICULTY_COLORS: Record<string, string> = {
  basic: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40" />)}</div>}>
      <FlashcardsContent />
    </Suspense>
  );
}

function FlashcardsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "";

  const { data, isLoading } = useQuery<{ items: Deck[] }>({
    queryKey: ["flashcard-decks", category],
    queryFn: () => {
      const qs = category ? `?category=${category}` : "";
      return apiFetch<{ items: Deck[] }>(`/api/flashcards/decks${qs}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flash Cards</h1>
          <p className="mt-1 text-sm text-slate-500">Study vocabulary and grammar with spaced repetition.</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/flashcards">
          <Button variant={!category ? "default" : "outline"} size="sm">All</Button>
        </Link>
        {CATEGORIES.map((cat) => (
          <Link key={cat} href={`/flashcards?category=${cat}`}>
            <Button variant={category === cat ? "default" : "outline"} size="sm" className="capitalize">
              {cat}
            </Button>
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !data?.items.length ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-slate-500">
            <p>No flashcard decks available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((deck) => (
            <Card key={deck.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{deck.title}</h3>
                    {deck.description && (
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{deck.description}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="neutral" className="capitalize">{deck.category}</Badge>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_COLORS[deck.difficulty] ?? "bg-slate-100 text-slate-600"}`}>
                    {deck.difficulty}
                  </span>
                  <span className="text-xs text-slate-400">{deck.cardCount} cards</span>
                </div>
                <Link href={`/flashcards/${deck.id}/study`} className="mt-4 block">
                  <Button className="w-full">Study Now</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
