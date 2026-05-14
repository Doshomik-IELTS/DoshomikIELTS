import Link from "next/link";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { BetaFeedback } from "@/components/feedback/beta-feedback";
import { LogoutButton } from "@/components/auth/logout-button";

const learnerNav: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resources", href: "/resources" },
  { label: "Practice", href: "/practice" },
  { label: "Mock Tests", href: "/mock-tests" },
  { label: "Referrals", href: "/referrals" },
  { label: "Profile", href: "/profile" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 hidden w-64 border-r border-slate-200 bg-white p-6 md:block">
        <Link href="/dashboard" className="text-xl font-bold text-blue-800">
          IELTS++
        </Link>
        <SidebarNav items={learnerNav} />
        <div className="mt-8">
          <LogoutButton />
        </div>
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
      <BetaFeedback />
    </div>
  );
}
