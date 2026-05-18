import { logger } from "@/lib/observability/logger";

export function logRouteError(
  route: string,
  error: unknown,
  context: Record<string, unknown> = {},
) {
  logger.error("route handler error", {
    route,
    error: error instanceof Error ? error.message : String(error),
    ...context,
  });
}
