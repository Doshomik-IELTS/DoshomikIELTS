import { redirect } from "next/navigation";
import { TestDetailEditor } from "@/components/admin/test-detail-editor";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminLayout } from "@/components/layout/admin-layout";

export default async function AdminEditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <TestDetailEditor testId={id} />
      </div>
    </AdminLayout>
  );
}