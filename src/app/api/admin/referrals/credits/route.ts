import { fail, ok } from "@/lib/api/response";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";
import type { CreditTxType } from "@prisma/client";

const grantSchema = z.object({
  profileId: z.string().uuid(),
  amount: z.number().int().min(1),
  description: z.string().min(1).max(255),
});



export async function GET(request: Request) {
  await requireAdminActor();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;
  const profileId = searchParams.get("profileId");
  const type = searchParams.get("type") as CreditTxType | null;

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
  let actor;
  try {
    actor = await requireAdminActor();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

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
