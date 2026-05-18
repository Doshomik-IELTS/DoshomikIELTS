import { CircuitBreaker } from "@/lib/resilience/circuit-breaker";

export const strapiCircuitBreaker = new CircuitBreaker({
  name: "strapi",
  failureThreshold: 3,
  resetAfterMs: 30_000,
  retryAttempts: 1,
  retryDelayMs: 200,
});

export const supabaseCircuitBreaker = new CircuitBreaker({
  name: "supabase",
  failureThreshold: 3,
  resetAfterMs: 30_000,
  retryAttempts: 1,
  retryDelayMs: 200,
});

export const openAiCircuitBreaker = new CircuitBreaker({
  name: "openai",
  failureThreshold: 3,
  resetAfterMs: 30_000,
  retryAttempts: 1,
  retryDelayMs: 500,
});

export const anthropicCircuitBreaker = new CircuitBreaker({
  name: "anthropic",
  failureThreshold: 3,
  resetAfterMs: 30_000,
  retryAttempts: 1,
  retryDelayMs: 500,
});

export const geminiCircuitBreaker = new CircuitBreaker({
  name: "gemini",
  failureThreshold: 3,
  resetAfterMs: 30_000,
  retryAttempts: 1,
  retryDelayMs: 500,
});
