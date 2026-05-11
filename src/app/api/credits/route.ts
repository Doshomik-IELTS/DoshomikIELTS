import { ok } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { getCreditBalance } from "@/lib/referral/service";

export async function GET() {
  const current = await requireCurrentUser();
  const { balance } = await getCreditBalance(current.profile.id);
  return ok({ balance });
}
