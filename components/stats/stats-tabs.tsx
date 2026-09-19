"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/stats/", label: "Times" },
  { href: "/stats/profile/", label: "Solve profile" },
] as const;

/** Switches between timer stats and the solve profile. */
export function StatsTabs() {
  const pathname = usePathname() ?? "";
  const current = pathname.replace(/\/?$/, "/");
  return (
    <nav aria-label="Stats views" className="mb-4 flex">
      <div className="inline-flex rounded-xl border bg-background/40 p-1 glass">
        {TABS.map((tab) => {
          const active = current === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
