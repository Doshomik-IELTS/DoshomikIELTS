import { ok } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getCreditBalance } from "@/lib/referral/service";

export async function GET() {
  const current = await requireCurrentUser();

  const { balance } = await getCreditBalance(current.profile.id);

  const transactions = await prisma.creditLedger.findMany({
    where: { profileId: current.profile.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      amount: true,
      type: true,
      description: true,
      refId: true,
      createdAt: true,
    },
  });

  return ok({ balance, recentTransactions: transactions });
}
