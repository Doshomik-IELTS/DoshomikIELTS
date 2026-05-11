import Link from "next/link";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const adminNav: { label: string; href: string }[] = [
  { label: "Admin home", href: "/admin" },
  { label: "Resources", href: "/admin/resources" },
  { label: "Tests", href: "/admin/tests" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Referrals", href: "/admin/referrals" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 hidden w-64 border-r border-slate-200 bg-white p-6 md:block">
        <Link href="/admin" className="text-xl font-bold text-blue-800">
          IELTS++ Admin
        </Link>
        <SidebarNav items={adminNav} backHref="/dashboard" backLabel="Learner app" />
      </aside>
      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
