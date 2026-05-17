import { evaluateWithDeterministicProvider } from "./deterministic-provider";
import type { EvaluationRequest, EvaluationProviderResult } from "./types";
import { evaluationSchema, WRITING_SYSTEM_PROMPT, SPEAKING_SYSTEM_PROMPT, WRITING_CRITIQUE_PROMPT, SPEAKING_CRITIQUE_PROMPT } from "./schemas";

export async function evaluateWithLLM(
  request: EvaluationRequest,
): Promise<EvaluationProviderResult> {
  const provider = process.env.LLM_PROVIDER || "";
  const apiKey = process.env.LLM_API_KEY || "";

  if (!provider || !apiKey) {
    console.warn("[evaluation] No LLM provider configured, falling back to deterministic");
    return evaluateWithDeterministicProvider(request);
  }

  try {
    if (provider === "openai") {
      return await evaluateWithOpenAI(request);
    }
    if (provider === "anthropic") {
      return await evaluateWithAnthropic(request);
    }
    if (provider === "gemini") {
      return await evaluateWithGemini(request);
    }
    console.warn(`[evaluation] Unknown provider ${provider}, falling back to deterministic`);
    return evaluateWithDeterministicProvider(request);
  } catch (error) {
    console.error("[evaluation] LLM call failed:", error);
    return evaluateWithDeterministicProvider(request);
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
      "Authorization": `Bearer ${process.env.LLM_API_KEY || ""}`,
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

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON response from OpenAI: ${content.slice(0, 300)}`);
  }
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
      "x-api-key": process.env.LLM_API_KEY || "",
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

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON response from Anthropic: ${content.slice(0, 300)}`);
  }
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

async function evaluateWithGemini(
  request: EvaluationRequest,
): Promise<EvaluationProviderResult> {
  const model = request.kind === "writing"
    ? (process.env.LLM_MODEL_WRITING || "gemini-2.0-flash")
    : (process.env.LLM_MODEL_SPEAKING || "gemini-2.0-flash-lite");

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

  const apiKey = process.env.LLM_API_KEY || "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: systemPrompt },
            { text: userPrompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Empty response from Gemini");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON response from Gemini: ${content.slice(0, 300)}`);
  }
  const result = evaluationSchema.parse(parsed);

  return {
    overallBand: result.overallBand,
    criteriaBands: result.criteriaBands,
    feedback: result.feedback,
    needsHumanReview: result.needsHumanReview ?? (result.overallBand < 4),
    provider: "gemini",
    model,
    promptVersion: "ielts-rubric-v1",
  };
}
