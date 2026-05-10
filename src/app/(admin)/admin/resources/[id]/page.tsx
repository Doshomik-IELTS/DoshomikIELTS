import { redirect } from "next/navigation";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { canArchiveResource, canPublishResource } from "@/lib/auth/admin-api";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminLayout } from "@/components/layout/admin-layout";

export default async function AdminEditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <div className="container">
        <ResourceEditor
          mode="edit"
          resourceId={id}
          canPublish={canPublishResource(user.profile.roles)}
          canArchive={canArchiveResource(user.profile.roles)}
        />
      </div>
    </AdminLayout>
  );
}
