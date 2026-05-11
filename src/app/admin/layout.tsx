import { redirect } from "next/navigation";
import { requireAdminActor } from "@/lib/auth/admin-api";
import { AdminLayout } from "@/components/layout/admin-layout";

export default async function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  try {
    await requireAdminActor();
  } catch {
    redirect("/login");
  }
  return <AdminLayout>{children}</AdminLayout>;
}
