import { fail, ok } from "@/lib/api/response";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { verifyCsrf } from "@/lib/security/csrf";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const revokeSchema = z.object({
  profileId: z.string().uuid(),
  amount: z.number().int().min(1),
  description: z.string().min(1).max(255),
});

export async function POST(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const csrfResponse = verifyCsrf(request);
  if (csrfResponse) return csrfResponse;

  const body = await request.json().catch(() => null);
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid revoke data.", details: parsed.error.flatten() }, 400);
  }

  const { profileId, amount, description } = parsed.data;

  const exists = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!exists) {
    return fail({ code: "NOT_FOUND", message: "Profile not found." }, 404);
  }

  const tx = await prisma.creditLedger.create({
    data: {
      profileId,
      amount: -amount,
      type: "admin_revoke",
      description,
    },
  });

  logAuditEvent({
    action: "credits.revoke",
    entityType: "CreditLedger",
    entityId: tx.id,
    actorId: actor.profile.id,
    metadata: { profileId, amount, description },
  });

  return ok(tx, { status: 201 });
}
