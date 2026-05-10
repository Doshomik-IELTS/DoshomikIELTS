import { redirect } from "next/navigation";
import { TestEditorForm } from "@/components/admin/test-editor-form";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminLayout } from "@/components/layout/admin-layout";

export default async function AdminNewTestPage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="mb-6 text-2xl font-bold">Create Test</h1>
        <TestEditorForm />
      </div>
    </AdminLayout>
  );
}