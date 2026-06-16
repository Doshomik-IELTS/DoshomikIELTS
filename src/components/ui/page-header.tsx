interface PageHeaderProps {
  title: string;
  description?: string;
  meta?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, meta, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div>
        {meta && <p className="text-sm font-medium text-primary mb-1">{meta}</p>}
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  );
}
