import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  footer,
  children,
  className,
}: FeatureCardProps) {
  return (
    <article className={cn("flex flex-col rounded-xl border bg-card p-5", className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Icon className="size-5 text-primary" aria-hidden />
        {badge && (
          <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground capitalize">
            {badge}
          </span>
        )}
      </div>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children}
      {footer && (
        <div className="mt-auto border-t pt-3 text-xs text-muted-foreground">{footer}</div>
      )}
    </article>
  );
}
