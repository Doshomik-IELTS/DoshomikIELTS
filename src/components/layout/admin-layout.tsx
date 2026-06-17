import Link from "next/link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AdminHeaderNav } from "@/components/layout/admin-header-nav";
import { Logo } from "@/components/layout/logo";

const adminNav: { label: string; href: string }[] = [
  { label: "Overview", href: "/admin" },
  { label: "Strapi Resources", href: "/admin/resources" },
  { label: "Strapi Mock Tests", href: "/admin/tests" },
  { label: "Flashcards", href: "/admin/flashcards" },
  { label: "Reviews", href: "/admin/reviews" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <MobileNav brand={<Logo variant="text" size="sm" admin />} items={adminNav} backHref="/dashboard" backLabel="Learner app" />
      <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/95 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6 lg:px-8">
          <Link href="/admin" className="shrink-0">
            <Logo variant="text" size="md" admin />
          </Link>
          <AdminHeaderNav items={adminNav} />
          <Link
            href="/dashboard"
            className="ml-auto shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            Learner app
          </Link>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="outline-none">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
