import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import type { ReferralStatus } from "@prisma/client";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["active", "suspended", "deactivated"]),
});

export async function GET(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return fail({ code: "VALIDATION_ERROR", message: "Missing code query parameter." }, 400);
  }

  const referral = await prisma.referral.findUnique({
    where: { code },
    include: {
      referrer: { select: { id: true, email: true, name: true } },
      redemptions: {
        include: {
          referee: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!referral) {
    return fail({ code: "NOT_FOUND", message: "Referral not found." }, 404);
  }

  const earningsResult = await prisma.creditLedger.aggregate({
    where: { profileId: referral.referrerId, type: "referral_bonus" },
    _sum: { amount: true },
  });

  return ok({
    referral: {
      id: referral.id,
      code: referral.code,
      status: referral.status,
      createdAt: referral.createdAt,
      referrer: referral.referrer,
      redemptions: referral.redemptions.map((r) => ({
        id: r.id,
        status: r.status,
        referrerReward: r.referrerReward,
        refereeReward: r.refereeReward,
        createdAt: r.createdAt,
        processedAt: r.processedAt,
        referee: r.referee,
      })),
    },
    referrerEarnings: earningsResult._sum.amount ?? 0,
    totalRedemptions: referral.redemptions.filter((r) => r.status === "completed").length,
  });
}

export async function PATCH(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return fail({ code: "VALIDATION_ERROR", message: "Missing code query parameter." }, 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid status value." }, 400);
  }

  const updated = await prisma.referral.update({
    where: { code },
    data: { status: parsed.data.status as ReferralStatus },
  });

  return ok(updated);
}
