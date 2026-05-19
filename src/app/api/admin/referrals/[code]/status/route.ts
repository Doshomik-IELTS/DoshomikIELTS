import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { ReferralStatus } from "@prisma/client";

const statusSchema = z.object({
  status: z.enum(["active", "suspended", "deactivated"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const { code } = await params;

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
