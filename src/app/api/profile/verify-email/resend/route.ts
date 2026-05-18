import { fail, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { supabaseCircuitBreaker } from "@/lib/resilience/external-services";

export async function POST() {
  const current = await getCurrentUser();

  if (!current) {
    return fail({ code: "UNAUTHENTICATED", message: "You must be logged in." }, 401);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError || !user?.email) {
    return fail({ code: "INTERNAL_ERROR", message: "Could not fetch user data." }, 500);
  }
  const email = user.email;

  if (user.email_confirmed_at) {
    return fail({ code: "INVALID_STATE", message: "Email is already verified." }, 400);
  }

  const { error } = await supabaseCircuitBreaker.execute(async () => {
    const serviceClient = createSupabaseServiceClient();
    return serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/profile/verify-email/callback`,
    });
  });

  if (error) {
    return fail({ code: "INTERNAL_ERROR", message: "Failed to resend verification email." }, 500);
  }

  return ok({ message: "Verification email sent." });
}
