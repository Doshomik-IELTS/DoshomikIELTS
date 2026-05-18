import { z } from "zod";
import { fail } from "@/lib/api/response";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export function parseQuery<T extends z.ZodType>(
  request: Request,
  schema: T,
): { data: z.infer<T>; response: null } | { data: null; response: Response } {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    return {
      data: null,
      response: fail(
        {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: z.treeifyError(parsed.error),
        },
        400,
      ),
    };
  }

  return { data: parsed.data, response: null };
}

export function paginateArray<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
    },
  };
}
