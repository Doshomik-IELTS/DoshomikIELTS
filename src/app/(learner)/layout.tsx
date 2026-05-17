import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SkipNav } from "@/components/ui/skip-nav";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SkipNav />
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  );
}
