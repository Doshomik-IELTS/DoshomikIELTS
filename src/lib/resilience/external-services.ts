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
