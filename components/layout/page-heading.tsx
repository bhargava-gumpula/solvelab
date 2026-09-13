interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <div className="mb-7 flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 eyebrow text-primary">{eyebrow}</p>}
        <h1 className="bg-gradient-to-br from-foreground via-foreground to-foreground/55 bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
