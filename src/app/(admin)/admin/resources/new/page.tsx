import { redirect } from "next/navigation";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";

export default async function AdminNewResourcePage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <StrapiAuthoringPanel
      collection="resources"
      title="Create resources in Strapi"
      description="Use the Strapi Resource collection to create, edit, publish, and unpublish learner resources."
    />
  );
}
