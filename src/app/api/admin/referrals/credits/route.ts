import { fail, ok } from "@/lib/api/response";
import { paginationSchema, parseQuery } from "@/lib/api/validation";
import { requireAdminActorOrResponse } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const grantSchema = z.object({
  profileId: z.string().uuid(),
  amount: z.number().int().min(1),
  description: z.string().min(1).max(255),
});

const querySchema = paginationSchema.extend({
  profileId: z.string().uuid().optional(),
  type: z.enum(["referral_bonus", "redemption", "admin_grant", "admin_revoke", "refund", "promo"]).optional(),
});

export async function GET(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;

  const parsedQuery = parseQuery(request, querySchema);
  if (parsedQuery.response) return parsedQuery.response;
  const { page, limit, profileId, type } = parsedQuery.data;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    ...(profileId ? { profileId } : {}),
    ...(type ? { type } : {}),
  };

  const [total, transactions] = await Promise.all([
    prisma.creditLedger.count({ where }),
    prisma.creditLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        profile: { select: { id: true, email: true, name: true } },
      },
    }),
  ]);

  return ok({
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      refId: t.refId,
      createdAt: t.createdAt,
      profile: t.profile,
    })),
    page,
    limit,
    total,
  });
}

export async function POST(request: Request) {
  const adminAuth = await requireAdminActorOrResponse();
  if (adminAuth.response) return adminAuth.response;
  const actor = adminAuth.actor;

  const body = await request.json().catch(() => null);
  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    return fail({ code: "VALIDATION_ERROR", message: "Invalid grant data.", details: parsed.error.flatten() }, 400);
  }

  const { profileId, amount, description } = parsed.data;

  const exists = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!exists) {
    return fail({ code: "NOT_FOUND", message: "Profile not found." }, 404);
  }

  const tx = await prisma.creditLedger.create({
    data: {
      profileId,
      amount,
      type: "admin_grant",
      description,
    },
  });

  logAuditEvent({
    action: "credits.grant",
    entityType: "CreditLedger",
    entityId: tx.id,
    actorId: actor.profile.id,
    metadata: { profileId, amount, description },
  });

  return ok(tx, { status: 201 });
}
