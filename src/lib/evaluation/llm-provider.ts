import { evaluateResponse as evaluateDeterministic } from "./provider";
import type { EvaluationRequest, EvaluationProviderResult } from "./types";
import { evaluationSchema, WRITING_SYSTEM_PROMPT, SPEAKING_SYSTEM_PROMPT, WRITING_CRITIQUE_PROMPT, SPEAKING_CRITIQUE_PROMPT } from "./schemas";

const PROVIDER = process.env.LLM_PROVIDER || "";
const API_KEY = process.env.LLM_API_KEY || "";

export async function evaluateWithLLM(
  request: EvaluationRequest,
): Promise<EvaluationProviderResult> {
  if (!PROVIDER || !API_KEY) {
    console.warn("[evaluation] No LLM provider configured, falling back to deterministic");
    return evaluateDeterministic(request);
  }

  try {
    if (PROVIDER === "openai") {
      return evaluateWithOpenAI(request);
    }
    if (PROVIDER === "anthropic") {
      return evaluateWithAnthropic(request);
    }
    console.warn(`[evaluation] Unknown provider ${PROVIDER}, falling back to deterministic`);
    return evaluateDeterministic(request);
  } catch (error) {
    console.error("[evaluation] LLM call failed:", error);
    return evaluateDeterministic(request);
  }
}

async function evaluateWithOpenAI(
  request: EvaluationRequest,
): Promise<EvaluationProviderResult> {
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = request.kind === "writing"
    ? (process.env.LLM_MODEL_WRITING || "gpt-4o")
    : (process.env.LLM_MODEL_SPEAKING || "gpt-4o-mini");

  const systemPrompt = request.kind === "writing"
    ? WRITING_SYSTEM_PROMPT
    : SPEAKING_SYSTEM_PROMPT;

  const userPrompt = request.kind === "writing"
    ? WRITING_CRITIQUE_PROMPT
      .replace("{{RESPONSE}}", request.responseText)
      .replace("{{WORD_COUNT}}", String(request.wordCount ?? request.responseText.split(/\s+/).length))
      .replace("{{TASK_TYPE}}", request.promptLabel)
    : SPEAKING_CRITIQUE_PROMPT
      .replace("{{RESPONSE}}", request.responseText)
      .replace("{{WORD_COUNT}}", String(request.wordCount ?? request.responseText.split(/\s+/).length))
      .replace("{{TASK_TYPE}}", request.promptLabel);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content);
  const result = evaluationSchema.parse(parsed);

  return {
    overallBand: result.overallBand,
    criteriaBands: result.criteriaBands,
    feedback: result.feedback,
    needsHumanReview: result.needsHumanReview ?? (result.overallBand < 4),
    provider: "openai",
    model,
    promptVersion: "ielts-rubric-v1",
  };
}

async function evaluateWithAnthropic(
  request: EvaluationRequest,
): Promise<EvaluationProviderResult> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1";
  const model = request.kind === "writing"
    ? (process.env.LLM_MODEL_WRITING || "claude-sonnet-4-20250514")
    : (process.env.LLM_MODEL_SPEAKING || "claude-haiku-3-20240307");

  const systemPrompt = request.kind === "writing"
    ? WRITING_SYSTEM_PROMPT
    : SPEAKING_SYSTEM_PROMPT;

  const userPrompt = request.kind === "writing"
    ? WRITING_CRITIQUE_PROMPT
      .replace("{{RESPONSE}}", request.responseText)
      .replace("{{WORD_COUNT}}", String(request.wordCount ?? request.responseText.split(/\s+/).length))
      .replace("{{TASK_TYPE}}", request.promptLabel)
    : SPEAKING_CRITIQUE_PROMPT
      .replace("{{RESPONSE}}", request.responseText)
      .replace("{{WORD_COUNT}}", String(request.wordCount ?? request.responseText.split(/\s+/).length))
      .replace("{{TASK_TYPE}}", request.promptLabel);

  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    content: Array<{ text: string }>;
  };

  const content = data.content[0]?.text;
  if (!content) {
    throw new Error("Empty response from Anthropic");
  }

  const parsed = JSON.parse(content);
  const result = evaluationSchema.parse(parsed);

  return {
    overallBand: result.overallBand,
    criteriaBands: result.criteriaBands,
    feedback: result.feedback,
    needsHumanReview: result.needsHumanReview ?? (result.overallBand < 4),
    provider: "anthropic",
    model,
    promptVersion: "ielts-rubric-v1",
  };
}