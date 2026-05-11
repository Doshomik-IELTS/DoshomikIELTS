import { fail, ok } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getReferralCodeForProfile } from "@/lib/referral/service";

export async function GET(request: Request) {
  const current = await requireCurrentUser();
  const referral = await getReferralCodeForProfile(current.profile.id);

  if (!referral) {
    return fail({ code: "NOT_FOUND", message: "No referral code found." }, 404);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
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
