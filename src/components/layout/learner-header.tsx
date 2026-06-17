"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const learnerNav: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resources", href: "/resources" },
  { label: "Practice", href: "/practice" },
  { label: "Mock Tests", href: "/mock-tests" },
  { label: "Progress", href: "/progress" },
  { label: "Referrals", href: "/referrals" },
  { label: "Profile", href: "/profile" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActiveAttemptPath(pathname: string) {
  return /^\/attempts\/[^/]+$/.test(pathname);
}

function isAttemptPage(pathname: string) {
  return /^\/attempts\/[^/]+(?:\/.*)?$/.test(pathname);
}

export function LearnerHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!moreOpen) return;
    function close(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-more-dropdown]")) setMoreOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [moreOpen]);

  // Show minimal header during active attempts (logo + exit)
  if (isActiveAttemptPath(pathname)) {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="shrink-0">
            <Logo variant="text" size="md" />
          </Link>
          <p className="text-sm text-slate-500">Test in progress</p>
        </div>
      </header>
    );
  }

  // Hide header on nested attempt pages (score, report) — they have breadcrumbs
  if (isAttemptPage(pathname)) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/dashboard" className="shrink-0" onClick={() => setOpen(false)}>
            <Logo variant="text" size="md" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Learner navigation">
            {learnerNav.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(pathname, item.href)
                      ? "bg-primary-soft text-primary"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/mock-tests"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(pathname, "/mock-tests") ? "bg-primary-soft text-primary" : "text-primary hover:bg-primary-soft",
            )}
          >
            Start mock
          </Link>
          <div className="relative" data-more-dropdown>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              data-more-dropdown
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    learnerNav.slice(4).some((item) => isActive(pathname, item.href))
                      ? "bg-primary-soft text-primary"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              More
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 z-50 mt-1 w-40 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {learnerNav.slice(4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "block px-4 py-2 text-sm",
                      isActive(pathname, item.href)
                        ? "bg-primary-soft text-primary"
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <LogoutButton />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden">
          <nav className="grid gap-1" aria-label="Learner mobile navigation">
            {learnerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  isActive(pathname, item.href) ? "bg-primary-soft text-primary" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-slate-100 pt-3">
            <LogoutButton />
          </div>
        </div>
      ) : null}
    </header>
  );
}
