"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
}

interface SidebarNavProps {
  items: NavItem[];
  backHref?: string;
  backLabel?: string;
}

export function SidebarNav({ items, backHref, backLabel }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 grid gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      {backHref && (
        <Link
          href={backHref}
          className="mt-6 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          ← {backLabel ?? "Back"}
        </Link>
      )}
    </nav>
  );
}
