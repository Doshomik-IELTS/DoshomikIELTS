import type { EvaluationKind, EvaluationRequest, EvaluationProviderResult } from "./types";

const WRITING_CRITERIA = [
  "taskAchievement",
  "coherenceCohesion",
  "lexicalResource",
  "grammarRangeAccuracy",
] as const;

const SPEAKING_CRITERIA = [
  "fluencyCoherence",
  "lexicalResource",
  "grammarRangeAccuracy",
  "pronunciation",
] as const;

export function evaluateWithDeterministicProvider(
  request: EvaluationRequest,
): EvaluationProviderResult {
  const words = request.responseText.trim().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map((word) => word.toLowerCase().replace(/[^a-z]/g, "")));
  const sentenceCount = Math.max(1, request.responseText.split(/[.!?]+/).filter(Boolean).length);
  const avgSentenceLength = words.length / sentenceCount;
  const lexicalRatio = words.length > 0 ? uniqueWords.size / words.length : 0;

  const lengthBand = bandFromLength(request.kind, request.wordCount ?? words.length);
  const coherenceBand = bandFromSentenceLength(avgSentenceLength);
  const lexicalBand = bandFromLexicalRatio(lexicalRatio);
  const grammarBand = bandFromBasicSignals(request.responseText);
  const pronunciationBand = request.kind === "speaking" ? 5.5 : undefined;

  const criteriaBands: Record<string, number> =
    request.kind === "writing"
      ? {
          [WRITING_CRITERIA[0]]: lengthBand,
          [WRITING_CRITERIA[1]]: coherenceBand,
          [WRITING_CRITERIA[2]]: lexicalBand,
          [WRITING_CRITERIA[3]]: grammarBand,
        }
      : {
          [SPEAKING_CRITERIA[0]]: coherenceBand,
          [SPEAKING_CRITERIA[1]]: lexicalBand,
          [SPEAKING_CRITERIA[2]]: grammarBand,
          [SPEAKING_CRITERIA[3]]: pronunciationBand ?? 5.5,
        };

  const average =
    Object.values(criteriaBands).reduce((sum, band) => sum + band, 0) /
    Object.values(criteriaBands).length;
  const overallBand = roundToHalf(average);
  const tooShort = words.length < (request.kind === "writing" ? 80 : 20);

  return {
    overallBand,
    criteriaBands,
    feedback: {
      summary:
        "Automated MVP evaluation based on response length, variety, sentence control, and basic language signals.",
      strengths: [
        words.length > 0 ? "A response was submitted for evaluation." : "No clear response content was found.",
        lexicalRatio >= 0.45 ? "Vocabulary variety is reasonable for this response length." : "The response uses repeated vocabulary.",
      ],
      improvements: [
        tooShort ? "Develop the answer with more specific details and examples." : "Improve precision with clearer topic sentences and support.",
        "Review grammar, punctuation, and sentence boundaries before submission.",
      ],
      nextTask:
        request.kind === "writing"
          ? "Rewrite one paragraph with a clearer main idea and one concrete example."
          : "Record or write a longer answer with one reason, one example, and a short conclusion.",
    },
    needsHumanReview: tooShort || overallBand < 4,
    provider: process.env.LLM_PROVIDER || "deterministic-local",
    model:
      request.kind === "writing"
        ? process.env.LLM_MODEL_WRITING || "local-writing-rubric-v1"
        : process.env.LLM_MODEL_SPEAKING || "local-speaking-rubric-v1",
    promptVersion: "ielts-rubric-v1",
  };
}

function bandFromLength(kind: EvaluationKind, wordCount: number) {
  const target = kind === "writing" ? 250 : 90;
  if (wordCount >= target) return 7;
  if (wordCount >= target * 0.7) return 6;
  if (wordCount >= target * 0.45) return 5;
  if (wordCount >= target * 0.25) return 4;
  return 3;
}

function bandFromSentenceLength(avgSentenceLength: number) {
  if (avgSentenceLength >= 10 && avgSentenceLength <= 24) return 6.5;
  if (avgSentenceLength >= 6 && avgSentenceLength <= 30) return 5.5;
  return 4.5;
}

function bandFromLexicalRatio(lexicalRatio: number) {
  if (lexicalRatio >= 0.6) return 7;
  if (lexicalRatio >= 0.45) return 6;
  if (lexicalRatio >= 0.3) return 5;
  return 4;
}

function bandFromBasicSignals(text: string) {
  const hasCapitalStart = /^[A-Z]/.test(text.trim());
  const hasSentencePunctuation = /[.!?]/.test(text);
  const commaCount = (text.match(/,/g) ?? []).length;
  let band = 4.5;
  if (hasCapitalStart) band += 0.5;
  if (hasSentencePunctuation) band += 0.75;
  if (commaCount > 0) band += 0.25;
  return roundToHalf(Math.min(7, band));
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}
