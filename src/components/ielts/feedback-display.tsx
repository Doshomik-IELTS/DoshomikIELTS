"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FeedbackData = {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  nextTask?: string;
};

type CriteriaBands = Record<string, number>;

type FeedbackDisplayProps = {
  feedback?: FeedbackData | null;
  criteriaBands?: CriteriaBands | null;
  overallBand?: number | null;
  type?: "writing" | "speaking";
};

const WRITING_CRITERIA_LABELS: Record<string, string> = {
  taskAchievement: "Task Achievement",
  taskResponse: "Task Response",
  coherenceCohesion: "Coherence & Cohesion",
  lexicalResource: "Lexical Resource",
  grammarRangeAccuracy: "Grammar Range & Accuracy",
};

const SPEAKING_CRITERIA_LABELS: Record<string, string> = {
  fluencyCoherence: "Fluency & Coherence",
  lexicalResource: "Lexical Resource",
  grammarRangeAccuracy: "Grammar Range & Accuracy",
  pronunciation: "Pronunciation",
};

function bandColor(band: number): string {
  if (band >= 7) return "text-green-600";
  if (band >= 5.5) return "text-amber-600";
  return "text-red-600";
}

function bandBarWidth(band: number): string {
  return `${(band / 9) * 100}%`;
}

function getCriterionLabel(key: string, type?: "writing" | "speaking"): string {
  if (type === "writing") return WRITING_CRITERIA_LABELS[key] ?? key;
  if (type === "speaking") return SPEAKING_CRITERIA_LABELS[key] ?? key;
  const allLabels = { ...WRITING_CRITERIA_LABELS, ...SPEAKING_CRITERIA_LABELS };
  return allLabels[key] ?? key;
}

function CriteriaBreakdown({ criteriaBands, type }: { criteriaBands: CriteriaBands; type?: "writing" | "speaking" }) {
  return (
    <div className="space-y-3">
      {Object.entries(criteriaBands).map(([key, band]) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{getCriterionLabel(key, type)}</span>
            <span className={`font-bold ${bandColor(band)}`} aria-label={`${getCriterionLabel(key, type)}: ${band.toFixed(1)} out of 9`}>{band.toFixed(1)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={band} aria-valuemin={1} aria-valuemax={9} aria-label={`${getCriterionLabel(key, type)} score`}>
            <div
              className={`h-full rounded-full transition-all ${band >= 7 ? "bg-green-500" : band >= 5.5 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: bandBarWidth(band) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedbackDisplay({ feedback, criteriaBands, overallBand, type }: FeedbackDisplayProps) {
  if (!feedback && !criteriaBands) {
    return null;
  }

  return (
    <div className="space-y-4">
      {overallBand != null && criteriaBands && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Criteria Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CriteriaBreakdown criteriaBands={criteriaBands} type={type} />
          </CardContent>
        </Card>
      )}

      {feedback?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-700">{feedback.summary}</p>
          </CardContent>
        </Card>
      )}

      {feedback?.strengths && feedback.strengths.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base text-green-800">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {feedback?.improvements && feedback.improvements.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base text-amber-800">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {feedback.improvements.map((improvement, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                  <Badge variant="neutral" className="mt-0.5 shrink-0 text-xs">{i + 1}</Badge>
                  <span>{improvement}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {feedback?.nextTask && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-800">Recommended Next Step</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700">{feedback.nextTask}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
