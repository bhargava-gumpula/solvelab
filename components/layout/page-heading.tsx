interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * A page's heading: an optional quiet section label, the title large in the
 * serif and the description as an italic deck. Round 2 dropped the review's
 * masthead line and rule above it.
 */
export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <header className="mb-10 pt-3">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-2 eyebrow">{eyebrow}</p> : null}
          <h1 className="font-display text-[clamp(2.6rem,6vw,4.75rem)] leading-[0.95] text-balance text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl font-display text-[clamp(1.15rem,1.7vw,1.4rem)] leading-snug text-pretty text-muted-foreground italic">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
