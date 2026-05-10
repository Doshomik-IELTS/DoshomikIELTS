import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/session";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";

export default async function DashboardPage() {
  try {
    await requireCurrentUser();
  } catch {
    redirect("/login?next=/dashboard");
  }

  return <DashboardSummary />;
}