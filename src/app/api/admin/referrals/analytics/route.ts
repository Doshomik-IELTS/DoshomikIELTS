import { ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalReferrals,
    totalRedemptions,
    creditsAgg,
    recentRedemptions,
    topReferrers,
    dailyRedemptions,
  ] = await Promise.all([
    prisma.referral.count(),
    prisma.referralRedemption.count({ where: { status: "completed" } }),
    prisma.creditLedger.aggregate({
      where: { type: "referral_bonus", amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.referralRedemption.count({
      where: { status: "completed", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.referral.findMany({
      orderBy: { redemptions: { _count: "desc" } },
      take: 10,
      include: {
        referrer: { select: { id: true, email: true, name: true } },
        redemptions: {
          where: { status: "completed" },
          select: { id: true },
        },
      },
    }),
    prisma.referralRedemption.groupBy({
      by: ["createdAt"],
      where: { status: "completed", createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    }),
  ]);

  const dailyMap: Record<string, number> = {};
  for (const row of dailyRedemptions) {
    const dateStr = row.createdAt.toISOString().slice(0, 10);
    dailyMap[dateStr] = (dailyMap[dateStr] ?? 0) + row._count;
  }

  const dailyData = Object.entries(dailyMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const conversionRate = totalReferrals > 0 ? totalRedemptions / totalReferrals : 0;

  return ok({
    totalReferrals,
    totalRedemptions,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalCreditsIssued: creditsAgg._sum.amount ?? 0,
    topReferrers: topReferrers.map((r) => ({
      profileId: r.referrerId,
      email: r.referrer.email,
      name: r.referrer.name,
      totalRedemptions: r.redemptions.length,
    })),
    recentRedemptionsCount: recentRedemptions,
    dailyData,
  });
}
