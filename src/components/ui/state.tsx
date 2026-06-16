interface StateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "empty" | "error" | "loading" | "info";
}

export function State({ title, description, icon, action, variant = "empty" }: StateProps) {
  if (variant === "loading") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-10 text-slate-600">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        <p className="mt-3 text-sm font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
    );
  }

  if (variant === "error") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 text-red-900">
        {icon && <div className="mb-2 text-red-600">{icon}</div>}
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="mt-2 text-sm">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  if (variant === "info") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-primary-soft bg-primary-soft p-8 text-primary">
        {icon && <div className="mb-2 text-primary">{icon}</div>}
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="mt-2 text-sm">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      {icon && <div className="mb-2 text-slate-400">{icon}</div>}
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
