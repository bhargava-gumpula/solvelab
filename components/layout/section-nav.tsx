"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { isActiveItem, type NavigationTab } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";

/** The second row of navigation: the pages inside the current tab. */
export function SectionNav({ tab, pathname }: { tab: NavigationTab; pathname: string }) {
  return (
    <nav
      aria-label={`${tab.label} sections`}
      data-focus-hide
      className="sticky top-16 z-30 mx-auto flex max-w-[1280px] justify-center px-3 pb-1 sm:px-5"
    >
      <ul className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1 glass">
        {tab.sections.map((item) => {
          const active = isActiveItem(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={`${item.href}/`}
                aria-current={active ? "page" : undefined}
                data-testid={`section-${item.label.toLowerCase()}`}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId={`section-${tab.id}`}
                    className="absolute inset-0 rounded-full bg-primary shadow-[0_0_18px_-4px_var(--glow)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <Icon aria-hidden className="relative size-3.5" />
                <span className="relative">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
