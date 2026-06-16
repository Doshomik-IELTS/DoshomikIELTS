"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  label: string;
  href: string;
};

export function AdminHeaderNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
