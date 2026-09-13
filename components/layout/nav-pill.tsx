"use client";

/*
 * Floating navigation with a sliding "tubelight" indicator, inspired by the
 * Tubelight Navbar on 21st.dev (https://21st.dev/@ayushmxxn/components/tubelight-navbar)
 * and rebuilt on motion's shared layout animation.
 */
import Link from "next/link";
import { motion } from "motion/react";
import { isActivePath, type NavigationItem } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";

interface NavPillProps {
  items: readonly NavigationItem[];
  pathname: string;
  layoutId: string;
  variant: "top" | "bottom";
  label: string;
}

export function NavPill({ items, pathname, layoutId, variant, label }: NavPillProps) {
  return (
    <nav aria-label={label}>
      <ul
        className={cn(
          "flex items-center gap-1 rounded-full p-1",
          // Content scrolls under the phone tab bar, so it gets a solid surface instead of glass.
          variant === "top"
            ? "glass"
            : "justify-between border bg-background shadow-[0_12px_40px_-12px_rgb(0_0_0/0.6)]",
        )}
      >
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href} className={cn(variant === "bottom" && "flex-1")}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors",
                  variant === "top" ? "px-3.5 py-1.5" : "flex-col gap-0.5 px-2 py-1.5 text-[11px]",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 -z-0 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary",
                        variant === "top" ? "-top-1" : "-bottom-1",
                      )}
                    >
                      <span className="absolute -inset-x-2 -inset-y-2 rounded-full bg-primary/30 blur-md" />
                    </span>
                  </motion.span>
                )}
                <Icon
                  aria-hidden
                  className={cn(
                    "relative size-4",
                    variant === "bottom" && "size-5",
                    !active && "opacity-80",
                  )}
                />
                <span className={cn("relative", variant === "top" && "sr-only lg:not-sr-only")}>
                  {itemLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
