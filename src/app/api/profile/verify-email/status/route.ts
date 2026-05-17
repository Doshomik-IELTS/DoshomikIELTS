import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const current = await getCurrentUser();

  if (!current) {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return fail({ code: "INTERNAL_ERROR", message: "Could not fetch user data." }, 500);
  }

  return ok({
    email: user.email,
    emailVerified: user.email_confirmed_at != null,
    confirmedAt: user.email_confirmed_at ?? null,
  });
}
