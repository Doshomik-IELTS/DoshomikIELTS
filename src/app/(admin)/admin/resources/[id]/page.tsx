import { redirect } from "next/navigation";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";

export default async function AdminEditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <StrapiAuthoringPanel
      collection="resources"
      title="Edit resources in Strapi"
      description="Open the Strapi Resource collection to edit, publish, or unpublish this content."
    />
  );
}
