import { fail, ok } from "@/lib/api/response";
import { paginationSchema, parseQuery } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getReferralCodeForProfile } from "@/lib/referral/service";

export async function GET(request: Request) {
  const current = await requireCurrentUser();
  const referral = await getReferralCodeForProfile(current.profile.id);

  if (!referral) {
    return fail({ code: "NOT_FOUND", message: "No referral code found." }, 404);
  }

  const parsedQuery = parseQuery(request, paginationSchema);
  if (parsedQuery.response) return parsedQuery.response;
  const { page, limit } = parsedQuery.data;
  const skip = (page - 1) * limit;

  const [total, redemptions] = await Promise.all([
    prisma.referralRedemption.count({ where: { referralId: referral.id } }),
    prisma.referralRedemption.findMany({
      where: { referralId: referral.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        referee: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  return ok({
    redemptions: redemptions.map((r) => ({
      id: r.id,
      status: r.status,
      referrerReward: r.referrerReward,
      refereeReward: r.refereeReward,
      createdAt: r.createdAt,
      processedAt: r.processedAt,
      referee: r.referee,
    })),
    page,
    limit,
    total,
  });
}
