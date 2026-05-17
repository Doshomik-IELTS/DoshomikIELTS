import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { profileToMeResponse } from "@/lib/api/me-types";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login?next=/profile");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const emailVerified = user?.email_confirmed_at != null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Set your target band and study goal."
        actions={
          <div className="flex gap-2">
            {!emailVerified && (
              <Link href="/profile/verify-email">
                <Button variant="destructive" size="sm">
                  Verify Email
                </Button>
              </Link>
            )}
            <Link href="/referrals">
              <Button variant="outline" size="sm">
                View Referral Program
              </Button>
            </Link>
          </div>
        }
      />
      <ProfileEditor initialMe={profileToMeResponse(current.profile)} />
    </div>
  );
}
