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
    <article className="mx-auto max-w-3xl">
      <p className="eyebrow text-primary">SolveLab</p>
      <h1 className="mt-2 bg-gradient-to-br from-foreground via-foreground to-foreground/55 bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{updated}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_p]:max-w-prose [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
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
