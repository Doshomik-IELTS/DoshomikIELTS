"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  label: string;
  href: string;
};

export function MobileNav({
  brand,
  items,
  backHref,
  backLabel,
  footer,
}: {
  brand: string;
  items: MobileNavItem[];
  backHref?: string;
  backLabel?: string;
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href={items[0]?.href ?? "/"} className="font-bold text-secondary" onClick={() => setOpen(false)}>
          {brand}
        </Link>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          Menu
        </Button>
      </div>
      {open ? (
        <div className="border-t border-slate-100 px-4 py-3">
          <nav className="grid gap-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium",
                    active ? "bg-primary-soft text-primary" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {backHref ? (
              <Link
                href={backHref}
                onClick={() => setOpen(false)}
                className="mt-3 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                {backLabel ?? "Back"}
              </Link>
            ) : null}
          </nav>
          {footer ? <div className="mt-4 border-t border-slate-100 pt-3">{footer}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
