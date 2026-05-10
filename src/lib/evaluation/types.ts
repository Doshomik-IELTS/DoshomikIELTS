export type EvaluationKind = "writing" | "speaking";

export type EvaluationRequest = {
  kind: EvaluationKind;
  promptLabel: string;
  responseText: string;
  wordCount?: number;
};

export type EvaluationProviderResult = {
  overallBand: number;
  criteriaBands: Record<string, number>;
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
    nextTask: string;
  };
  needsHumanReview: boolean;
  provider: string;
  model: string;
  promptVersion: string;
};