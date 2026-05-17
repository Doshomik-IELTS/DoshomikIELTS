import { redirect } from "next/navigation";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";

export default async function AdminEditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <div className="container">
        <StrapiAuthoringPanel
          collection="resources"
          title="Edit resources in Strapi"
          description="Resource authoring now happens in Strapi. Open the Strapi Resource collection to edit, publish, or unpublish this content."
        />
      </div>
    </AdminLayout>
  );
}
