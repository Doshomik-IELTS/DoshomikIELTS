import { ok } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getOrCreateReferralCode } from "@/lib/referral/service";

export async function GET() {
  const current = await requireCurrentUser();
  const { profile } = current;

  const referral = await getOrCreateReferralCode(profile.id);

  const completedRedemptions = await prisma.referralRedemption.count({
    where: { referralId: referral.id, status: "completed" },
  });

  const earningsResult = await prisma.creditLedger.aggregate({
    where: { profileId: profile.id, type: "referral_bonus" },
    _sum: { amount: true },
  });

  return ok({
    code: referral.code,
    status: referral.status,
    totalRedemptions: completedRedemptions,
    creditsEarned: earningsResult._sum.amount ?? 0,
    shareUrl: `/signup?ref=${referral.code}`,
  });
}
