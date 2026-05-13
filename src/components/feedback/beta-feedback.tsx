"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";

const CATEGORIES = [
  { value: "bug", label: "Bug", description: "Something is not working" },
  { value: "feature", label: "Feature", description: "Request a new feature" },
  { value: "improvement", label: "Improvement", description: "Make something better" },
  { value: "general", label: "General", description: "Other feedback" },
] as const;

export function BetaFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string>("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (message.length < 10) {
      setError("Please provide more details (at least 10 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          category,
          message,
          pageUrl: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage("");
        setCategory("general");
      }, 2000);
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        Send Feedback
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-slate-900">Beta Feedback</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>

      {submitted ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-slate-600 text-sm">Thank you for your feedback!</p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-1 block">Category</label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    category === cat.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-1 block">Your feedback</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="min-h-[80px] text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="sm">
            {isSubmitting ? "Sending..." : "Submit Feedback"}
          </Button>
        </>
      )}
    </div>
  );
}