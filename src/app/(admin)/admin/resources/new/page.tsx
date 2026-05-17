import { redirect } from "next/navigation";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";

export default async function AdminNewResourcePage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <div className="container">
        <StrapiAuthoringPanel
          collection="resources"
          title="Create resources in Strapi"
          description="The custom IELTS++ resource editor has been replaced by Strapi. Use the Strapi Resource collection to create and publish learner resources."
        />
      </div>
    </AdminLayout>
  );
}
