"use client";

/*
 * The second row of navigation: small quiet labels with an accent rule that
 * slides under the current page (Round 2 dropped the numerals).
 */
import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { isActiveItem, type NavigationTab } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";

/** Shorter labels for phones, where the whole index must fit one line. */
const SHORT: Record<string, string> = { Algorithms: "Algs" };

export function SectionNav({ tab, pathname }: { tab: NavigationTab; pathname: string }) {
  const listRef = useRef<HTMLUListElement>(null);
  // Keep the current section in view when the index scrolls sideways (phones).
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !current || list.scrollWidth <= list.clientWidth) return;
    list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
  }, [pathname]);
  // Fade an end only while there is more of the index past it.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const mark = () => {
      const more = list.scrollWidth - list.clientWidth;
      list.toggleAttribute("data-more-start", more > 1 && list.scrollLeft > 1);
      list.toggleAttribute("data-more-end", more > 1 && list.scrollLeft < more - 1);
    };
    mark();
    const observer = new ResizeObserver(mark);
    observer.observe(list);
    list.addEventListener("scroll", mark, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", mark);
    };
  }, [pathname]);
  return (
    <nav
      aria-label={`${tab.label} sections`}
      data-focus-hide
      style={{ viewTransitionName: "site-sections" }}
      className="sticky top-16 z-30 mx-auto flex max-w-[1280px] justify-center px-4"
    >
      <ul
        ref={listRef}
        className="fade-x no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto px-2 sm:gap-2 sm:px-1"
      >
        {tab.sections.map((item) => {
          const active = isActiveItem(pathname, item);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={`${item.href}/`}
                aria-current={active ? "page" : undefined}
                aria-label={SHORT[item.label] ? item.label : undefined}
                data-testid={`section-${item.label.toLowerCase()}`}
                className={cn(
                  "group/section relative flex items-baseline gap-1.5 px-2 pt-1 pb-2 text-[13px] tracking-[-0.005em] transition-colors duration-200 sm:px-2.5",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {SHORT[item.label] ? (
                  <>
                    <span className="sm:hidden">{SHORT[item.label]}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                ) : (
                  <span>{item.label}</span>
                )}
                {active ? (
                  <motion.span
                    layoutId={`section-${tab.id}`}
                    layoutDependency={item.href}
                    aria-hidden
                    className="absolute inset-x-2 bottom-0.5 h-[1.5px] rounded-full bg-foreground sm:inset-x-2.5"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="absolute inset-x-2.5 bottom-0.5 h-px origin-left scale-x-0 rounded-full bg-foreground/25 transition-transform duration-300 group-hover/section:scale-x-100"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
