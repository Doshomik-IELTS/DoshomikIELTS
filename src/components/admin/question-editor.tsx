"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";

type Question = {
  id: string;
  questionType: string;
  prompt: string;
  optionsJson: Record<string, unknown> | null;
  orderIndex: number;
  difficulty: string;
  answerKey: {
    canonicalAnswer: string;
    acceptedAnswersJson: unknown;
  } | null;
};

type QuestionEditorProps = {
  sectionId: string;
  questions: Question[];
  onQuestionsChange?: (questions: Question[]) => void;
};

export function QuestionEditor({ sectionId, questions, onQuestionsChange }: QuestionEditorProps) {
  const [adding, setAdding] = useState(false);
  const [newQuestionPrompt, setNewQuestionPrompt] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("multiple_choice");
  const [newCorrectAnswer, setNewCorrectAnswer] = useState("");

  async function addQuestion() {
    if (!newQuestionPrompt.trim() || !newCorrectAnswer.trim()) return;
    setAdding(true);

    try {
      const res = await apiFetch<{ id: string }>(`/api/admin/questions`, {
        method: "POST",
        body: JSON.stringify({
          sectionId,
          questionType: newQuestionType,
          prompt: newQuestionPrompt.trim(),
          orderIndex: questions.length,
          answerKey: {
            canonicalAnswer: newCorrectAnswer.trim(),
          },
        }),
      });

      const newQuestion: Question = {
        id: res.id,
        questionType: newQuestionType,
        prompt: newQuestionPrompt.trim(),
        optionsJson: null,
        orderIndex: questions.length,
        difficulty: "basic",
        answerKey: {
          canonicalAnswer: newCorrectAnswer.trim(),
          acceptedAnswersJson: null,
        },
      };

      onQuestionsChange?.([...questions, newQuestion]);
      setNewQuestionPrompt("");
      setNewCorrectAnswer("");
    } catch (e) {
      console.error("Failed to add question:", e);
    } finally {
      setAdding(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm("Delete this question?")) return;

    try {
      await apiFetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });
      onQuestionsChange?.(questions.filter((q) => q.id !== questionId));
    } catch (e) {
      console.error("Failed to delete question:", e);
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Questions ({questions.length})</h4>

      {questions.length === 0 ? (
        <p className="text-sm text-slate-500">No questions yet.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded border border-slate-200 p-3"
            >
              <div className="flex justify-between">
                <p className="font-medium">Q{q.orderIndex + 1}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteQuestion(q.id)}
                >
                  Delete
                </Button>
              </div>
              <p className="text-sm">{q.prompt}</p>
              <p className="text-xs text-slate-500">
                Type: {q.questionType} • Answer: {q.answerKey?.canonicalAnswer}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 border-t pt-4">
        <div className="space-y-1">
          <Label>Question Type</Label>
          <select
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={newQuestionType}
            onChange={(e) => setNewQuestionType(e.target.value)}
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="short_answer">Short Answer</option>
            <option value="true_false">True/False</option>
            <option value="fill_blank">Fill in the Blank</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label>Question Prompt</Label>
          <Textarea
            value={newQuestionPrompt}
            onChange={(e) => setNewQuestionPrompt(e.target.value)}
            placeholder="Enter the question..."
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <Label>Correct Answer</Label>
          <Input
            value={newCorrectAnswer}
            onChange={(e) => setNewCorrectAnswer(e.target.value)}
            placeholder="Correct answer"
          />
        </div>

        <Button onClick={addQuestion} disabled={adding || !newQuestionPrompt.trim() || !newCorrectAnswer.trim()}>
          {adding ? "Adding..." : "Add Question"}
        </Button>
      </div>
    </div>
  );
}