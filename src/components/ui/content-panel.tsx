import * as React from "react";
import { cn } from "@/lib/utils";

interface ContentPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentPanel({ children, className }: ContentPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
