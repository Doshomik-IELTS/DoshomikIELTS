import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-blue-50 text-blue-700 ring-blue-700/10",
        neutral: "bg-slate-100 text-slate-700 ring-slate-700/10",
        success: "bg-green-50 text-green-700 ring-green-700/10",
        warning: "bg-amber-50 text-amber-700 ring-amber-700/10",
        danger: "bg-red-50 text-red-700 ring-red-700/10",
        info: "bg-sky-50 text-sky-700 ring-sky-700/10",
        review: "bg-orange-50 text-orange-700 ring-orange-700/10",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
