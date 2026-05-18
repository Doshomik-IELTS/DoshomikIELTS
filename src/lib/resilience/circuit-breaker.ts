import { logger } from "@/lib/observability/logger";

type CircuitState = "closed" | "open" | "half-open";

type CircuitBreakerOptions = {
  name: string;
  failureThreshold?: number;
  resetAfterMs?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
};

type CircuitBreakerStatus = {
  state: CircuitState;
  failures: number;
  openedAt: number | null;
};

export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ExternalServiceError";
  }
}

export class CircuitOpenError extends ExternalServiceError {
  constructor(service: string) {
    super(`${service} circuit is open`, service);
    this.name = "CircuitOpenError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private openedAt: number | null = null;

  private readonly failureThreshold: number;
  private readonly resetAfterMs: number;
  private readonly retryAttempts: number;
  private readonly retryDelayMs: number;

  constructor(private readonly options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetAfterMs = options.resetAfterMs ?? 30_000;
    this.retryAttempts = options.retryAttempts ?? 1;
    this.retryDelayMs = options.retryDelayMs ?? 150;
  }

  status(): CircuitBreakerStatus {
    return {
      state: this.currentState(),
      failures: this.failures,
      openedAt: this.openedAt,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.currentState() === "open") {
      logger.warn("external service circuit open", { service: this.options.name });
      throw new CircuitOpenError(this.options.name);
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retryAttempts; attempt += 1) {
      try {
        const result = await operation();
        this.recordSuccess();
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < this.retryAttempts) {
          await sleep(this.retryDelayMs * (attempt + 1));
        }
      }
    }

    this.recordFailure(lastError);
    throw new ExternalServiceError(`${this.options.name} request failed`, this.options.name, lastError);
  }

  private currentState(): CircuitState {
    if (this.state === "open" && this.openedAt && Date.now() - this.openedAt >= this.resetAfterMs) {
      this.state = "half-open";
    }
    return this.state;
  }

  private recordSuccess() {
    if (this.state !== "closed" || this.failures > 0) {
      logger.info("external service circuit recovered", { service: this.options.name });
    }
    this.state = "closed";
    this.failures = 0;
    this.openedAt = null;
  }

  private recordFailure(error: unknown) {
    this.failures += 1;
    logger.warn("external service call failed", {
      service: this.options.name,
      failures: this.failures,
      error: error instanceof Error ? error.message : String(error),
    });

    if (this.failures >= this.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
      logger.error("external service circuit opened", { service: this.options.name });
    }
  }
}

export function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out",
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(timeoutMessage)), timeoutMs);

  return operation(controller.signal).finally(() => clearTimeout(timeout));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
