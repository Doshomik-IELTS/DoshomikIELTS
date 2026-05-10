import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { PageHeader } from "@/components/ui/page-header";
import { profileToMeResponse } from "@/lib/api/me-types";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ProfilePage() {
  const current = await getCurrentUser();
  if (!current) {
    redirect("/login?next=/profile");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Set your target band and study goal."
      />
      <ProfileEditor initialMe={profileToMeResponse(current.profile)} />
    </div>
  );
}
