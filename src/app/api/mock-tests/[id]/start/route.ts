import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api/response";
import { redeemCreditForTest, getCreditBalance, processOngoingPurchase } from "@/lib/referral/service";
import { ensureLocalTestFromStrapi, isStrapiId } from "@/lib/strapi/content";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireCurrentUser();
  } catch {
    return fail({ code: "UNAUTHENTICATED", message: "Authentication required" }, 401);
  }

  const { id: testId } = await params;

  if (isStrapiId(testId)) {
    const synced = await ensureLocalTestFromStrapi(testId);
    if (!synced) {
      return fail({ code: "NOT_FOUND", message: "Mock test not found" }, 404);
    }
  }

  const test = await prisma.test.findUnique({
    where: { id: testId, status: "published" },
  });

  if (!test) {
    return fail({ code: "NOT_FOUND", message: "Mock test not found" }, 404);
  }

  const existingAttempt = await prisma.mockTestAttempt.findFirst({
    where: {
      profileId: actor.profile.id,
      testId,
      status: { in: ["in_progress", "evaluating"] },
    },
  });

  if (existingAttempt) {
    return ok({
      id: existingAttempt.id,
      testId: existingAttempt.testId,
      status: existingAttempt.status,
      startedAt: existingAttempt.startedAt,
    });
  }

  try {
    await redeemCreditForTest(actor.profile.id, testId);
  } catch (err) {
    if (err instanceof Error && err.message === "INSUFFICIENT_CREDITS") {
      const { balance } = await getCreditBalance(actor.profile.id);
      return fail({ code: "INSUFFICIENT_CREDITS", message: "Not enough credits to start this mock test.", details: { balance } }, 402);
    }
    throw err;
  }

  await processOngoingPurchase(actor.profile.id);

  const attempt = await prisma.mockTestAttempt.create({
    data: {
      profileId: actor.profile.id,
      testId,
      status: "in_progress",
    },
  });

  return ok({
    id: attempt.id,
    testId: attempt.testId,
    status: attempt.status,
    startedAt: attempt.startedAt,
  }, { status: 201 });
}
