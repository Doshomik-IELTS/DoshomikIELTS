import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { creditBothParties, validateReferralCode } from "@/lib/referral/service";
import { referralRateLimiter, withRateLimit } from "@/lib/rate-limit";

const applySchema = z.object({
  code: z.string().min(1).max(32),
});

const checkRateLimit = withRateLimit(referralRateLimiter, (req: Request) => {
  const userId = req.headers.get("x-user-id") ?? "unknown";
  return userId;
});

export async function POST(request: Request) {
  const current = await requireCurrentUser();

  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const body = await request.json().catch(() => null);
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid request body." }, 400);
  }

  const { code } = parsed.data;
  const refereeId = current.profile.id;

  const alreadyReferred = await prisma.referralRedemption.findFirst({
    where: { refereeId },
  });
  if (alreadyReferred) {
    return fail({ code: "CONFLICT", message: "This account already used a referral code." }, 409);
  }

  const validation = await validateReferralCode(code);
  if (!validation.valid || !validation.referral) {
    const messages: Record<string, string> = {
      INVALID_CODE: "Referral code not found.",
      CODE_SUSPENDED: "This referral code is currently suspended.",
      PROGRAM_DISABLED: "Referral program is currently inactive.",
      CODE_MAXED_OUT: "This referral code has reached its usage limit.",
    };
    return fail({ code: "FORBIDDEN", message: messages[validation.error ?? ""] ?? "Invalid referral code." }, 403);
  }

  const referral = validation.referral;
  if (referral.referrerId === refereeId) {
    return fail({ code: "FORBIDDEN", message: "You cannot use your own referral code." }, 403);
  }

  const config = await prisma.referralConfig.findUnique({ where: { id: "singleton" } });
  const trigger = config?.rewardTrigger ?? "on_signup";

  const redemption = await prisma.referralRedemption.create({
    data: {
      referralId: referral.id,
      refereeId,
      referrerReward: config?.referrerReward ?? 1,
      refereeReward: config?.refereeReward ?? 1,
      status: trigger === "on_signup" ? "completed" : "pending",
      processedAt: trigger === "on_signup" ? new Date() : null,
    },
  });

  if (trigger === "on_signup") {
    await creditBothParties(refereeId, referral.referrerId, redemption.id);
  }

  return ok({
    success: true,
    message: trigger === "on_signup"
      ? "Referral code applied! Credits have been added to your account."
      : "Referral code applied! Credits will be added after your first purchase.",
    trigger,
  });
}
