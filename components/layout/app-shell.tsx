"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Keyboard, Layers3, Palette, Search, Settings2, Timer } from "lucide-react";
import { AccountButton } from "@/components/auth/account-button";
import { AppBackground } from "@/components/appearance/app-background";
import { AppearanceSheet } from "@/components/appearance/appearance-sheet";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRegisterCommands } from "@/hooks/use-commands";
import { algorithmSets } from "@/data/algorithms/sets";
import { useDailyCheckDue } from "@/hooks/use-daily-checks";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { brand } from "@/lib/config/brand";
import {
  isActivePath,
  LAST_TAB_KEY,
  navigation,
  settingsNavigation,
  tabOf,
  TABS,
} from "@/lib/config/navigation";
import { accessState, ACCOUNT_AREAS } from "@/lib/auth/access";
import { useAuth } from "@/components/auth/auth-provider";
import type { Command } from "@/lib/commands/registry";
import { THEMES } from "@/lib/appearance/themes";
import { cn } from "@/lib/utils";
import { revealTheme } from "@/components/appearance/theme-reveal";
import { LegalLinks } from "@/components/legal/legal-links";
import { LensFilter } from "@/components/fx/liquid-glass";
import { PageTransition } from "@/components/fx/page-transition";
import { BrandMark } from "./brand-mark";
import { CommandPalette } from "./command-palette";
import { NavPill } from "./nav-pill";
import { SectionNav } from "./section-nav";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { StorageAlert } from "./storage-alert";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { update } = useAppearance();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const fullBleed = isActivePath(pathname, "/timer");
  const dailyDue = useDailyCheckDue();
  const navAlerts = dailyDue ? { "/hub": "Today’s daily check is waiting" } : undefined;
  const tab = tabOf(pathname);
  // The lesson player has its own bar and a close button; no second bar under it on phones.
  const inLesson = pathname.startsWith("/hub/lesson/");

  // The site reopens on the tab you were last on, on this device only.
  useEffect(() => {
    if (!tab) return;
    try {
      localStorage.setItem(LAST_TAB_KEY, tab.id);
    } catch {
      // Private windows can refuse storage; the site then opens on the timer.
    }
  }, [tab]);
  // Signed out, the areas that keep your own data show a small lock.
  const lockedHrefs =
    accessState(useAuth().status) === "locked"
      ? ACCOUNT_AREAS.map((area) => `/${area}`)
      : undefined;
  const hideLegal =
    fullBleed ||
    isActivePath(pathname, "/privacy") ||
    isActivePath(pathname, "/terms") ||
    isActivePath(pathname, "/overview") ||
    isActivePath(pathname, "/signed-in");

  useHotkeys([
    { key: "k", mod: true, allowInInputs: true, run: () => setPaletteOpen((open) => !open) },
    { key: "t", run: () => setAppearanceOpen(true) },
    { key: "?", run: () => setShortcutsOpen(true) },
  ]);

  const commands = useMemo<Command[]>(
    () => [
      ...[...TABS.flatMap((tabItem) => tabItem.sections), settingsNavigation].map((item) => ({
        id: `go-${item.href}`,
        label: `Go to ${item.label}`,
        group: "Navigate" as const,
        icon: item.icon,
        run: () => router.push(item.href),
      })),
      // Every algorithm set, and practising it on a real cube.
      ...algorithmSets.flatMap((set) => [
        {
          id: `algorithms-${set.id}`,
          label: `Algorithms: ${set.name}`,
          group: "Navigate" as const,
          icon: Layers3,
          keywords: ["algorithm", "cases", set.id],
          run: () => router.push(`/algorithms/${set.id}/`),
        },
        // Fundamentals is a list of triggers, with no cases to set up.
        ...(set.category === "fundamentals"
          ? []
          : [
              {
                id: `practise-${set.id}`,
                label: `Practise ${set.name} on your cube`,
                group: "Navigate" as const,
                icon: Timer,
                keywords: ["trainer", "practise", "practice", "drill", set.id],
                run: () => router.push(`/algorithms/${set.id}/train/`),
              },
            ]),
      ]),
      {
        id: "appearance",
        label: "Open appearance",
        group: "Appearance",
        shortcut: "T",
        icon: Palette,
        run: () => setAppearanceOpen(true),
      },
      {
        id: "shortcuts",
        label: "Show keyboard shortcuts",
        group: "Navigate",
        shortcut: "?",
        icon: Keyboard,
        run: () => setShortcutsOpen(true),
      },
      ...THEMES.map((theme) => ({
        id: `theme-${theme.id}`,
        label: `Theme: ${theme.label}`,
        group: "Appearance" as const,
        keywords: ["theme", "color", theme.description],
        run: () => revealTheme(theme.id, null, () => update({ theme: theme.id })),
      })),
    ],
    [router, update],
  );
  useRegisterCommands("shell", commands);

  return (
    <>
      <AppBackground />
      <LensFilter />
      {/* One frosted backdrop behind the header and section index; scrolled content fades under it. */}
      <div
        aria-hidden
        data-focus-hide
        style={{ viewTransitionName: "site-topbar" }}
        className={cn(
          "studio-topbar pointer-events-none fixed inset-x-0 top-0 z-20",
          tab ? "h-[8rem]" : "h-[5.1rem]",
        )}
      />
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-md bg-foreground px-4 py-2 text-sm text-background focus:translate-y-0"
      >
        Skip to content
      </a>

      <header
        data-focus-hide
        style={{ viewTransitionName: "site-header" }}
        className="sticky top-0 z-40 grid h-16 grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]"
      >
        <Link
          href="/timer"
          aria-label={`${brand.name} home`}
          className="group flex items-center gap-2.5 justify-self-start rounded-full py-1 pr-2"
        >
          <span className="grid size-8 place-items-center rounded-[10px] bg-foreground text-background shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.15)] transition-transform duration-300 ease-out group-hover:-rotate-6">
            <BrandMark className="size-[18px]" />
          </span>
          <span aria-hidden className="text-[17px] leading-none font-semibold tracking-[-0.02em]">
            {brand.name.slice(0, 5)}
            <span className="font-display text-[21px] text-primary italic">
              {brand.name.slice(5)}
            </span>
          </span>
        </Link>

        <div className="hidden md:block">
          <NavPill
            items={navigation}
            pathname={pathname}
            layoutId="nav-top"
            variant="top"
            label="Main navigation"
            alerts={navAlerts}
            lockedHrefs={lockedHrefs}
          />
        </div>

        {/* Quiet utilities: plain icons, no capsule. Shortcuts stay on "?" and in ⌘K. */}
        <div className="flex items-center gap-1 justify-self-end">
          <button
            type="button"
            aria-label="Command palette"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-8 items-center gap-2 rounded-full pr-1.5 pl-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground lg:flex"
          >
            <Search aria-hidden className="size-3.5" />
            <kbd className="rounded-md bg-foreground/[0.05] px-1.5 py-px font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
          <HeaderButton
            label="Command palette"
            shortcut="⌘K"
            onClick={() => setPaletteOpen(true)}
            className="lg:hidden"
          >
            <Search />
          </HeaderButton>
          <HeaderButton
            label="Appearance"
            shortcut="T"
            onClick={() => setAppearanceOpen(true)}
            className="hidden sm:inline-flex"
          >
            <Palette />
          </HeaderButton>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <Link
                  href={settingsNavigation.href}
                  aria-label="Settings"
                  aria-current={
                    isActivePath(pathname, settingsNavigation.href) ? "page" : undefined
                  }
                >
                  <Settings2 />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <span aria-hidden className="mx-1 h-5 w-px bg-[var(--hairline)]" />
          <AccountButton />
        </div>
      </header>
      {tab ? <SectionNav tab={tab} pathname={pathname} /> : null}

      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "relative w-full outline-none",
          fullBleed ? "px-3 pb-32 sm:px-5 md:pb-0" : "page-frame mx-auto pt-5 pb-36 md:pb-14",
        )}
      >
        <StorageAlert />
        <PageTransition>
          {children}
          {hideLegal ? null : (
            <div data-focus-hide>
              <LegalLinks className="mt-12" />
            </div>
          )}
        </PageTransition>
      </main>

      {/* Phones: the page fades out above the floating nav, so nothing ever sits under it. */}
      <div
        aria-hidden
        data-focus-hide
        className={cn(
          "dock-scrim pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden",
          inLesson && "hidden",
        )}
      />
      <div
        data-focus-hide
        data-dock
        style={{ viewTransitionName: "site-dock" }}
        className={cn(
          "fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:hidden",
          inLesson && "hidden",
        )}
      >
        <div className="w-full max-w-[340px]">
          <NavPill
            items={navigation}
            pathname={pathname}
            layoutId="nav-bottom"
            variant="bottom"
            label="Mobile navigation"
            alerts={navAlerts}
            lockedHrefs={lockedHrefs}
          />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <AppearanceSheet open={appearanceOpen} onOpenChange={setAppearanceOpen} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}

function HeaderButton({
  label,
  shortcut,
  onClick,
  className,
  children,
}: {
  label: string;
  shortcut: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            "rounded-full text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
            className,
          )}
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label} <span className="ml-1 opacity-60">{shortcut}</span>
      </TooltipContent>
    </Tooltip>
  );
}
