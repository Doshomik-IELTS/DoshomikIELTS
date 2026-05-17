import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/layout/admin-layout";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { SkipNav } from "@/components/ui/skip-nav";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login?next=/admin");
  }

  if (!canAccessAdminRoutes(current.profile.roles)) {
    redirect("/dashboard");
  }

  return (
    <ErrorBoundary>
      <SkipNav />
      <AdminLayout>{children}</AdminLayout>
    </ErrorBoundary>
  );
}
