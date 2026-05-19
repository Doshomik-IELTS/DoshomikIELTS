import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { z } from "zod";


const updateConfigSchema = z.object({
  referrerReward: z.number().int().min(0).optional(),
  refereeReward: z.number().int().min(0).optional(),
  minPurchaseForReward: z.number().int().min(0).nullable().optional(),
  maxRedemptionsPerCode: z.number().int().min(1).nullable().optional(),
  rewardTrigger: z.enum(["on_signup", "on_first_purchase"]).optional(),
  enabled: z.boolean().optional(),
});

export async function GET() {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const config = await prisma.referralConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return ok(config);
}

export async function PATCH(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  const body = await request.json().catch(() => null);
  const parsed = updateConfigSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid config data.", details: parsed.error.flatten() }, 400);
  }

  const updated = await prisma.referralConfig.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });

  return ok(updated);
}
