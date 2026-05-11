import { ok } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { CreditTxType } from "@prisma/client";

export async function GET(request: Request) {
  const current = await requireCurrentUser();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;
  const type = searchParams.get("type") as CreditTxType | null;

  const where = {
    profileId: current.profile.id,
    ...(type ? { type } : {}),
  };

  const [total, transactions] = await Promise.all([
    prisma.creditLedger.count({ where }),
    prisma.creditLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        refId: true,
        createdAt: true,
      },
    }),
  ]);

  return ok({ transactions, page, limit, total });
}
