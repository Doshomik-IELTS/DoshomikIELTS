"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type ObjectiveQuestion = {
  id: string;
  prompt: string;
  questionType: string;
  optionsJson?: Record<string, unknown> | null;
  sourceSpanJson?: Record<string, unknown> | null;
};

function normalizedOptions(optionsJson?: Record<string, unknown> | null) {
  if (!optionsJson) return [];
  return Object.entries(optionsJson).map(([key, value]) => ({
    key,
    label: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

function isChoiceType(questionType: string) {
  return [
    "multiple_choice_single",
    "true_false_not_given",
    "yes_no_not_given",
    "map_labeling",
    "diagram_label",
    "matching",
  ].includes(questionType);
}

function isCompletionType(questionType: string) {
  return [
    "fill_blank",
    "short_answer",
    "sentence_completion",
    "summary_completion",
    "flow_chart_completion",
    "table_completion",
    "note_completion",
    "form_completion",
  ].includes(questionType);
}

export const ObjectiveQuestionRenderer = memo(function ObjectiveQuestionRenderer({
  question,
  value,
  disabled,
  onChange,
}: {
  question: ObjectiveQuestion;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const options = normalizedOptions(question.optionsJson);
  const visualUrl = typeof question.sourceSpanJson?.visualUrl === "string" ? question.sourceSpanJson.visualUrl : null;
  const visualAlt = typeof question.sourceSpanJson?.visualAlt === "string" ? question.sourceSpanJson.visualAlt : "Question visual";

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-slate-800">{question.prompt}</p>

      {(question.questionType === "map_labeling" || question.questionType === "diagram_label") && visualUrl ? (
        <div className="overflow-hidden rounded border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element -- Admin-provided media URLs may not be in Next image remotePatterns. */}
          <img src={visualUrl} alt={visualAlt} loading="lazy" className="max-h-80 w-full object-contain" />
        </div>
      ) : null}

      {isChoiceType(question.questionType) && options.length > 0 ? (
        <fieldset className="grid gap-2" disabled={disabled}>
          <legend className="sr-only">{question.prompt}</legend>
          {options.map((option) => (
            <label
              key={option.key}
              className={`flex cursor-pointer items-start gap-3 rounded border p-3 text-sm ${
                value === option.key ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <input
                type="radio"
                className="mt-0.5"
                name={question.id}
                value={option.key}
                checked={value === option.key}
                onChange={(event) => onChange(event.target.value)}
              />
              <span>
                <span className="font-medium">{option.key}.</span> {option.label}
              </span>
            </label>
          ))}
        </fieldset>
      ) : isCompletionType(question.questionType) ? (
        <Input
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your answer"
        />
      ) : (
        <Textarea
          value={value}
          disabled={disabled}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your answer"
        />
      )}
    </div>
  );
});
