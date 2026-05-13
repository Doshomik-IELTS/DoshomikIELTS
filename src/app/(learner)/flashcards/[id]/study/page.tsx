"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

type StudyCard = {
  id: string;
  front: string;
  back: string;
  examples: string[];
  hints: string[];
  difficulty: string;
  orderIndex: number;
  nextReview: string | null;
};

type Progress = {
  totalCards: number;
  dueToday: number;
  reviewedByUser: number;
  masteryPercent: number;
};

const RATING_LABELS = [
  { label: "Again", quality: 0, color: "bg-red-500 hover:bg-red-600 text-white" },
  { label: "Hard", quality: 2, color: "bg-orange-500 hover:bg-orange-600 text-white" },
  { label: "Good", quality: 4, color: "bg-green-500 hover:bg-green-600 text-white" },
  { label: "Easy", quality: 5, color: "bg-blue-500 hover:bg-blue-600 text-white" },
];

export default function FlashcardStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [deckId, setDeckId] = useState("");
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => { params.then(p => setDeckId(p.id)); }, [params]);

  const { data: deckData, isLoading } = useQuery<{ id: string; title: string; cards: StudyCard[] }>({
    queryKey: ["flashcard-deck", deckId],
    queryFn: () => apiFetch(`/api/flashcards/decks/${deckId}`),
    enabled: !!deckId,
  });

  const { data: progressData } = useQuery<Progress>({
    queryKey: ["flashcard-progress", deckId],
    queryFn: () => apiFetch(`/api/flashcards/decks/${deckId}/progress`),
    enabled: !!deckId,
  });

  useEffect(() => {
    if (deckData?.cards) {
      const due = deckData.cards.filter(c => c.nextReview && new Date(c.nextReview) <= new Date());
      const toStudy = due.length > 0 ? due : deckData.cards.slice(0, 20);
      setCards(toStudy);
    }
  }, [deckData]);

  const reviewMutation = useMutation({
    mutationFn: (data: { cardId: string; quality: number }) =>
      apiFetch(`/api/flashcards/study/${deckId}`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashcard-progress", deckId] });
    },
  });

  const handleRate = useCallback((quality: number) => {
    const card = cards[currentIndex];
    reviewMutation.mutate({ cardId: card.id, quality });
    setCompleted(prev => [...prev, card.id]);
    setFlipped(false);

    if (currentIndex + 1 >= cards.length) {
      setSessionDone(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [cards, currentIndex, reviewMutation]);

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? Math.round((completed.length / cards.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900">Session Complete!</h2>
            <p className="text-slate-500">
              You reviewed <strong>{completed.length}</strong> card{completed.length !== 1 ? "s" : ""} in this session.
            </p>
            {progressData && (
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Mastery: {progressData.masteryPercent}%</p>
                <div className="flex justify-center gap-4 text-sm">
                  <span>Total: {progressData.totalCards}</span>
                  <span>Due today: {progressData.dueToday}</span>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => router.push("/flashcards")}>
                Back to Decks
              </Button>
              {cards.length > completed.length && (
                <Button onClick={() => { setCurrentIndex(0); setCompleted([]); setSessionDone(false); setFlipped(false); }}>
                  Study More
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-slate-500">No cards to study right now.</p>
            <Button className="mt-4" variant="outline" onClick={() => router.push("/flashcards")}>
              Back to Decks
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{deckData?.title}</span>
          <span>{completed.length + 1} / {cards.length}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      <div
        className="relative cursor-pointer perspective-1000"
        onClick={() => setFlipped(f => !f)}
      >
        <Card
          className={`transition-all duration-300 ${flipped ? "rotate-y-180" : ""}`}
          style={{ minHeight: "240px" }}
        >
          <CardContent className="p-8 flex items-center justify-center text-center min-h-[240px]">
            {!flipped ? (
              <div className="space-y-4">
                <p className="text-lg font-medium text-slate-900">{currentCard.front}</p>
                {currentCard.hints.length > 0 && (
                  <p className="text-xs text-slate-400">💡 {currentCard.hints[0]}</p>
                )}
                <p className="text-xs text-slate-400 mt-4">Click to reveal answer</p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <p className="text-lg font-medium text-slate-900">{currentCard.front}</p>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-lg text-blue-700 font-semibold">{currentCard.back}</p>
                </div>
                {currentCard.examples.length > 0 && (
                  <div className="text-sm text-slate-500 italic">
                    {currentCard.examples.map((ex, i) => (
                      <p key={i} className="mt-1">{ex}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!flipped ? (
        <div className="flex justify-center">
          <Button size="lg" onClick={() => setFlipped(true)}>
            Show Answer
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          {RATING_LABELS.map(r => (
            <Button
              key={r.quality}
              className={`flex-1 ${r.color}`}
              onClick={() => handleRate(r.quality)}
              disabled={reviewMutation.isPending}
            >
              {r.label}
            </Button>
          ))}
        </div>
      )}

      {reviewMutation.isPending && (
        <p className="text-center text-sm text-slate-400">Saving...</p>
      )}
    </div>
  );
}
