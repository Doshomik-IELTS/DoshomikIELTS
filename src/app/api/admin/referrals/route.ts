import { ok } from "@/lib/api/response";
import { paginationSchema, parseQuery } from "@/lib/api/validation";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = paginationSchema.extend({
  status: z.enum(["active", "suspended", "deactivated"]).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export async function GET(request: Request) {
  await requireAdminActor();

  const parsedQuery = parseQuery(request, querySchema);
  if (parsedQuery.response) return parsedQuery.response;
  const { page, limit, status, search } = parsedQuery.data;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          referrer: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [total, referrals] = await Promise.all([
    prisma.referral.count({ where }),
    prisma.referral.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        referrer: { select: { id: true, email: true, name: true } },
        redemptions: {
          select: {
            id: true,
            status: true,
            referrerReward: true,
            refereeReward: true,
            createdAt: true,
            processedAt: true,
          },
        },
      },
    }),
  ]);

  return ok({
    referrals: referrals.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status,
      createdAt: r.createdAt,
      referrer: r.referrer,
      totalRedemptions: r.redemptions.filter((rd) => rd.status === "completed").length,
      referrerEarnings: r.redemptions
        .filter((rd) => rd.status === "completed")
        .reduce((sum, rd) => sum + rd.referrerReward, 0),
      refereeEarnings: r.redemptions
        .filter((rd) => rd.status === "completed")
        .reduce((sum, rd) => sum + rd.refereeReward, 0),
    })),
    page,
    limit,
    total,
  });
}
