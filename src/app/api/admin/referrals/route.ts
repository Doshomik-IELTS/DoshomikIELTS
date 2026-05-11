import { ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  await requireAdminActor();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;
  const status = searchParams.get("status");
  const search = searchParams.get("search");

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
