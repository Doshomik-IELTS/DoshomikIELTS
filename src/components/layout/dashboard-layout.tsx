import { BetaFeedback } from "@/components/feedback/beta-feedback";
import { LearnerHeader } from "@/components/layout/learner-header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <LearnerHeader />
      <main id="main-content" tabIndex={-1} className="outline-none">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
      <BetaFeedback />
    </div>
  );
}
