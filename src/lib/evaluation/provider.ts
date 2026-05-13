import { evaluateWithLLM } from "./llm-provider";
import { evaluateWithDeterministicProvider } from "./deterministic-provider";
import type { EvaluationRequest, EvaluationProviderResult } from "./types";

export type { EvaluationKind, EvaluationRequest, EvaluationProviderResult } from "./types";

export async function evaluateResponse(
  request: EvaluationRequest,
): Promise<EvaluationProviderResult> {
  const provider = process.env.LLM_PROVIDER;
  const apiKey = process.env.LLM_API_KEY;

  if (provider && apiKey) {
    return evaluateWithLLM(request);
  }

  return evaluateWithDeterministicProvider(request);
}
