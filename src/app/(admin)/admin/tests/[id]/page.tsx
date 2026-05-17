import { redirect } from "next/navigation";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";

export default async function AdminEditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  const user = await getCurrentUser();
  if (!user || !canAccessAdminRoutes(user.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      <div className="container py-8">
        <StrapiAuthoringPanel
          collection="mock-tests"
          title="Edit mock tests in Strapi"
          description="Mock-test authoring now happens in Strapi. Open the Strapi Mock Test collection to edit test definitions, sections, question groups, questions, answer keys, and media."
        />
      </div>
    </AdminLayout>
  );
}
