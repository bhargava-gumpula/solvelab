"use client";

/*
 * The two top-level places (Timer, Learning Hub) in a faint tray (a
 * liquid-glass dock on phones).
 * The active place wears an ink pill that slides between items (motion
 * shared layout). Top variant on desktop, bottom dock on phones.
 */
import Link from "next/link";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { isActiveItem, LAST_TAB_KEY, TABS, type NavigationItem } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";

interface NavPillProps {
  items: readonly NavigationItem[];
  pathname: string;
  layoutId: string;
  variant: "top" | "bottom";
  label: string;
  /** A dot on an item, keyed by href, with what it means for screen readers. */
  alerts?: Partial<Record<string, string>>;
  /** Items that need an account right now, so they show a small lock. */
  lockedHrefs?: readonly string[];
}

const INK_SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

/** Remember the place as it's chosen, so reopening the site finds it even before the page has drawn. */
function rememberTab(href: string) {
  const tab = TABS.find((item) => item.href === href);
  if (!tab) return;
  try {
    localStorage.setItem(LAST_TAB_KEY, tab.id);
  } catch {
    // Private windows can refuse storage; the app shell tries again once the page is up.
  }
}

export function NavPill({
  items,
  pathname,
  layoutId,
  variant,
  label,
  alerts,
  lockedHrefs,
}: NavPillProps) {
  const bottom = variant === "bottom";
  return (
    <nav aria-label={label}>
      <ul
        className={cn(
          "flex items-center gap-0.5 rounded-full p-1",
          bottom ? "justify-between p-1.5 liquid-glass" : "bg-foreground/[0.045]",
        )}
      >
        {items.map((item) => {
          const { href, label: itemLabel, icon: Icon, enabled, comingIn } = item;
          const active = isActiveItem(pathname, item);
          const preview = !enabled;
          const alert = alerts?.[href];
          const locked = lockedHrefs?.includes(href) ?? false;
          return (
            <li key={href} className={cn(bottom && "flex-1")}>
              <Link
                href={href}
                onClick={() => rememberTab(href)}
                aria-current={active ? "page" : undefined}
                aria-description={
                  locked
                    ? `${itemLabel} needs a Google account`
                    : preview && comingIn
                      ? `${itemLabel} planned for ${comingIn}`
                      : undefined
                }
                title={
                  locked
                    ? "Needs a Google account"
                    : preview && comingIn
                      ? `Planned for ${comingIn}`
                      : undefined
                }
                data-preview={preview ? "true" : undefined}
                className={cn(
                  "group/nav relative flex items-center justify-center gap-2 rounded-full font-medium outline-primary transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-3",
                  bottom ? "h-11 px-4 text-[13px]" : "h-8 px-3.5 text-[13px]",
                  active
                    ? "text-background"
                    : preview
                      ? "text-muted-foreground/70 hover:text-muted-foreground"
                      : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId={layoutId}
                    // Only a change of tab moves the pill; a route change inside
                    // the tab (while the page scrolls to the top) must not.
                    layoutDependency={href}
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-foreground shadow-[0_4px_10px_-6px_rgb(0_0_0/0.4),inset_0_1px_0_rgb(255_255_255/0.12)]"
                    transition={INK_SPRING}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-foreground/0 transition-colors duration-200 group-hover/nav:bg-foreground/[0.05]"
                  />
                )}
                <span className="relative">
                  <Icon
                    aria-hidden
                    strokeWidth={1.75}
                    className={cn("size-4", bottom && "size-[18px]", preview && "opacity-55")}
                  />
                  {locked ? (
                    <Lock
                      aria-hidden
                      className="absolute -top-1 -right-1.5 size-2.5 text-muted-foreground"
                      data-testid={`nav-locked-${href.replace(/\W/g, "")}`}
                    />
                  ) : null}
                  {alert && !locked ? (
                    <span
                      className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent-2 ring-2 ring-background"
                      data-testid={`nav-alert-${href.replace(/\W/g, "")}`}
                    >
                      <span className="sr-only">{alert}</span>
                    </span>
                  ) : null}
                </span>
                <span className="relative tracking-[-0.01em]">{itemLabel}</span>
                {preview && !bottom ? (
                  <span
                    aria-hidden
                    className="relative hidden text-[10px] font-normal text-muted-foreground xl:inline"
                  >
                    Soon
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
