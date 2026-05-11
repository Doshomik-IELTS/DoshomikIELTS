import { ok } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { getOrCreateReferralCode } from "@/lib/referral/service";

export async function POST() {
  const current = await requireCurrentUser();
  const referral = await getOrCreateReferralCode(current.profile.id);
  return ok({ code: referral.code }, { status: 201 });
}
