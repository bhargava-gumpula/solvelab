import Link from "next/link";
import { legalLinks } from "@/lib/config/legal";

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl pt-3">
      <p className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] pb-3 text-[10.5px] font-semibold tracking-[0.2em] uppercase">
        <span>The SolveLab Review</span>
        <span className="text-muted-foreground">{updated}</span>
      </p>
      <h1 className="mt-6 font-display text-[clamp(2.8rem,6vw,4.5rem)] leading-[0.95] text-foreground">
        {title}
      </h1>
      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[1.75rem] [&_h2]:leading-tight [&_h2]:font-normal [&_h2]:text-foreground [&_p]:max-w-prose [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&>p:first-child]:font-display [&>p:first-child]:text-[1.35rem] [&>p:first-child]:leading-snug [&>p:first-child]:text-foreground/80 [&>p:first-child]:italic">
        {children}
      </div>
      <nav className="mt-10 flex flex-wrap gap-4 text-sm" aria-label="Legal">
        {legalLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-primary underline-offset-4 hover:underline"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </article>
  );
}
