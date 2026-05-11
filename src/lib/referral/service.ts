import { prisma } from "@/lib/prisma";
import type { CreditTxType } from "@prisma/client";
import { generateReferralCode } from "./code-generator";

/** Seed the singleton ReferralConfig if it doesn't exist. */
export async function getOrCreateReferralConfig() {
  let config = await prisma.referralConfig.findUnique({
    where: { id: "singleton" },
  });
  if (!config) {
    config = await prisma.referralConfig.create({
      data: { id: "singleton" },
    });
  }
  return config;
}

export async function getCreditBalance(profileId: string) {
  const result = await prisma.creditLedger.aggregate({
    where: { profileId },
    _sum: { amount: true },
  });
  return { balance: result._sum.amount ?? 0 };
}

export async function createCreditTx(params: {
  profileId: string;
  amount: number;
  type: CreditTxType;
  description: string;
  refId?: string;
}) {
  return prisma.creditLedger.create({
    data: {
      profileId: params.profileId,
      amount: params.amount,
      type: params.type,
      description: params.description,
      refId: params.refId,
    },
  });
}

export async function creditBothParties(
  refereeId: string,
  referrerId: string,
  redemptionId: string,
) {
  const config = await getOrCreateReferralConfig();
  const { referrerReward, refereeReward } = config;

  await prisma.$transaction([
    prisma.creditLedger.create({
      data: {
        profileId: refereeId,
        amount: refereeReward,
        type: "referral_bonus",
        description: `Referral bonus: invited by ${referrerId}`,
        refId: redemptionId,
      },
    }),
    prisma.creditLedger.create({
      data: {
        profileId: referrerId,
        amount: referrerReward,
        type: "referral_bonus",
        description: `Referral bonus: referred ${refereeId}`,
        refId: redemptionId,
      },
    }),
  ]);
}

export async function getReferralCodeForProfile(profileId: string) {
  return prisma.referral.findUnique({
    where: { referrerId: profileId },
  });
}

export async function createReferral(profileId: string) {
  const code = await generateReferralCode(async (c) => {
    const existing = await prisma.referral.findUnique({ where: { code: c } });
    return !!existing;
  });
  return prisma.referral.create({
    data: { referrerId: profileId, code },
  });
}

export async function getOrCreateReferralCode(profileId: string) {
  const existing = await getReferralCodeForProfile(profileId);
  if (existing) return existing;
  return createReferral(profileId);
}

export async function processOngoingPurchase(profileId: string) {
  const pendingRedemptions = await prisma.referralRedemption.findMany({
    where: { refereeId: profileId, status: "pending" },
    include: { referral: true },
  });

  for (const redemption of pendingRedemptions) {
    await prisma.$transaction([
      prisma.referralRedemption.update({
        where: { id: redemption.id },
        data: { status: "completed", processedAt: new Date() },
      }),
      prisma.creditLedger.create({
        data: {
          profileId,
          amount: redemption.refereeReward,
          type: "referral_bonus",
          description: `Referral bonus: invited by ${redemption.referral.referrerId}`,
          refId: redemption.id,
        },
      }),
      prisma.creditLedger.create({
        data: {
          profileId: redemption.referral.referrerId,
          amount: redemption.referrerReward,
          type: "referral_bonus",
          description: `Referral bonus: referred ${profileId}`,
          refId: redemption.id,
        },
      }),
    ]);
  }
}

export async function redeemCreditForTest(profileId: string, testId: string) {
  const balance = await getCreditBalance(profileId);
  if (balance.balance < 1) {
    throw new Error("INSUFFICIENT_CREDITS");
  }
  await prisma.creditLedger.create({
    data: {
      profileId,
      amount: -1,
      type: "redemption",
      description: "Mock test redemption",
      refId: testId,
    },
  });
}

export async function validateReferralCode(code: string) {
  const referral = await prisma.referral.findUnique({
    where: { code },
    include: { redemptions: true },
  });

  if (!referral) return { valid: false, error: "INVALID_CODE" };
  if (referral.status !== "active") return { valid: false, error: "CODE_SUSPENDED" };

  const config = await getOrCreateReferralConfig();
  if (!config.enabled) return { valid: false, error: "PROGRAM_DISABLED" };

  if (
    config.maxRedemptionsPerCode &&
    referral.redemptions.filter((r) => r.status === "completed").length >= config.maxRedemptionsPerCode
  ) {
    return { valid: false, error: "CODE_MAXED_OUT" };
  }

  return { valid: true, referral };
}
