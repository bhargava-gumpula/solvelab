import type { LucideIcon } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
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
    <article
      className={cn(
        "relative flex flex-col rounded-2xl p-5 glass transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
    >
      <GlowingEffect />
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary shadow-[0_0_24px_-6px_var(--glow)]">
          <Icon className="size-5" aria-hidden />
        </span>
        {badge && (
          <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground capitalize">
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
