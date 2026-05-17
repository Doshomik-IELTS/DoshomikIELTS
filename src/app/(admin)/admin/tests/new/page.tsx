import { redirect } from "next/navigation";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";

export default async function AdminNewTestPage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <StrapiAuthoringPanel
          collection="mock-tests"
          title="Create mock tests in Strapi"
          description="The custom IELTS++ test builder has been replaced by Strapi. Use the Strapi Mock Test collection to create test definitions, sections, groups, questions, answer keys, and media."
        />
      </div>
    </AdminLayout>
  );
}
