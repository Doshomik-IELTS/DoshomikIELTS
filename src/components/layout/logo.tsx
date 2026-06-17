import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon" | "text";
type LogoSize = "sm" | "md" | "lg";

const sizeClasses: Record<LogoSize, { mark: string; text: string; gap: string }> = {
  sm: { mark: "h-7 w-7 rounded-lg", text: "text-base", gap: "gap-2" },
  md: { mark: "h-9 w-9 rounded-xl", text: "text-lg", gap: "gap-2" },
  lg: { mark: "h-10 w-10 rounded-xl", text: "text-2xl", gap: "gap-3" },
};

export function Logo({
  variant = "full",
  size = "md",
  inverse = false,
  admin = false,
  className,
}: {
  variant?: LogoVariant;
  size?: LogoSize;
  inverse?: boolean;
  admin?: boolean;
  className?: string;
}) {
  const sizes = sizeClasses[size];

  if (variant === "text") {
    return (
      <span className={cn("inline-flex items-center font-bold", inverse ? "text-white" : "text-secondary", sizes.text, className)}>
        DOshomik IELTS
        {admin ? <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">Admin</span> : null}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center font-bold", sizes.gap, inverse ? "text-white" : "text-secondary", sizes.text, className)}>
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-primary text-white shadow-sm",
          sizes.mark,
        )}
        aria-hidden="true"
      >
        <span className="text-[0.72em] font-black leading-none">D</span>
        <span className="absolute right-[18%] top-[16%] h-1.5 w-1.5 rounded-full bg-success" />
      </span>
      {variant === "full" ? (
        <span>
          DOshomik IELTS
          {admin ? <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">Admin</span> : null}
        </span>
      ) : null}
    </span>
  );
}
