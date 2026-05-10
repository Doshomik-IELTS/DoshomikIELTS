import { redirect } from "next/navigation";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();

  if (!current) {
    redirect("/login?next=/admin");
  }

  if (!canAccessAdminRoutes(current.profile.roles)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
