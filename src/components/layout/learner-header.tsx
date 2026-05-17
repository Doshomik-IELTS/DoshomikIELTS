"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

const learnerNav: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resources", href: "/resources" },
  { label: "Practice", href: "/practice" },
  { label: "Mock Tests", href: "/mock-tests" },
  { label: "Referrals", href: "/referrals" },
  { label: "Profile", href: "/profile" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isActiveAttemptPath(pathname: string) {
  return /^\/attempts\/[^/]+$/.test(pathname);
}

export function LearnerHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (isActiveAttemptPath(pathname)) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/dashboard" className="shrink-0 text-lg font-bold text-blue-800" onClick={() => setOpen(false)}>
            IELTS++
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Learner navigation">
            {learnerNav.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(pathname, item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/mock-tests"
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(pathname, "/mock-tests") ? "bg-blue-50 text-blue-700" : "text-blue-700 hover:bg-blue-50",
            )}
          >
            Start mock
          </Link>
          {learnerNav.slice(4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              {item.label}
            </Link>
          ))}
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
                  isActive(pathname, item.href) ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100",
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
