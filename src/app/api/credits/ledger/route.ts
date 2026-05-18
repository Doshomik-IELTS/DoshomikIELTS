import { ok } from "@/lib/api/response";
import { paginationSchema, parseQuery } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = paginationSchema.extend({
  type: z.enum(["referral_bonus", "redemption", "admin_grant", "admin_revoke", "refund", "promo"]).optional(),
});

export async function GET(request: Request) {
  const current = await requireCurrentUser();

  const parsedQuery = parseQuery(request, querySchema);
  if (parsedQuery.response) return parsedQuery.response;
  const { page, limit, type } = parsedQuery.data;
  const skip = (page - 1) * limit;

  const where = {
    profileId: current.profile.id,
    ...(type ? { type } : {}),
  };

  const [total, transactions] = await Promise.all([
    prisma.creditLedger.count({ where }),
    prisma.creditLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        refId: true,
        createdAt: true,
      },
    }),
  ]);

  return ok({ transactions, page, limit, total });
}
