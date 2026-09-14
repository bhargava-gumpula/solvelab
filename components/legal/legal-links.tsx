import Link from "next/link";
import { brand } from "@/lib/config/brand";
import { legal, legalLinks } from "@/lib/config/legal";
import { cn } from "@/lib/utils";

export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-sm", className)}
      aria-label="Site"
    >
      <Link
        href={legal.overviewPath}
        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {brand.name} {brand.version}
      </Link>
      {legalLinks
        .filter((item) => item.href !== legal.overviewPath)
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {item.label}
          </Link>
        ))}
    </nav>
  );
}
