"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Command as CommandIcon, Keyboard, Palette, Settings2 } from "lucide-react";
import { AccountButton } from "@/components/auth/account-button";
import { AppBackground } from "@/components/appearance/app-background";
import { AppearanceSheet } from "@/components/appearance/appearance-sheet";
import { useAppearance } from "@/components/appearance/appearance-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRegisterCommands } from "@/hooks/use-commands";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { brand } from "@/lib/config/brand";
import { isActivePath, navigation, settingsNavigation } from "@/lib/config/navigation";
import type { Command } from "@/lib/commands/registry";
import { THEMES } from "@/lib/appearance/themes";
import { cn } from "@/lib/utils";
import { LegalLinks } from "@/components/legal/legal-links";
import { BrandMark } from "./brand-mark";
import { CommandPalette } from "./command-palette";
import { NavPill } from "./nav-pill";
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
      ...[...navigation, settingsNavigation].map((item) => ({
        id: `go-${item.href}`,
        label: `Go to ${item.label}`,
        group: "Navigate" as const,
        icon: item.icon,
        run: () => router.push(item.href),
      })),
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
        run: () => update({ theme: theme.id }),
      })),
    ],
    [router, update],
  );
  useRegisterCommands("shell", commands);

  return (
    <>
      <AppBackground />
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-md bg-foreground px-4 py-2 text-sm text-background focus:translate-y-0"
      >
        Skip to content
      </a>

      <header
        data-focus-hide
        className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 px-3 sm:px-5"
      >
        <Link
          href="/timer"
          className="flex items-center gap-2 rounded-full px-2 py-1 text-base font-semibold tracking-tight"
        >
          <BrandMark className="size-6 text-primary drop-shadow-[0_0_12px_var(--glow)]" />
          <span>
            {brand.name.slice(0, 5)}
            <span className="text-primary">{brand.name.slice(5)}</span>
          </span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <NavPill
            items={navigation}
            pathname={pathname}
            layoutId="nav-top"
            variant="top"
            label="Main navigation"
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-full p-1 glass">
          <AccountButton />
          <HeaderButton label="Command palette" shortcut="⌘K" onClick={() => setPaletteOpen(true)}>
            <CommandIcon />
          </HeaderButton>
          <HeaderButton label="Appearance" shortcut="T" onClick={() => setAppearanceOpen(true)}>
            <Palette />
          </HeaderButton>
          <HeaderButton
            label="Keyboard shortcuts"
            shortcut="?"
            onClick={() => setShortcutsOpen(true)}
            className="hidden sm:inline-flex"
          >
            <Keyboard />
          </HeaderButton>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon-sm" className="rounded-full">
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
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "relative w-full outline-none",
          fullBleed
            ? "px-3 pb-24 sm:px-5 md:pb-5"
            : "mx-auto max-w-[1280px] px-4 pt-4 pb-28 md:px-6 md:pb-12",
        )}
      >
        <StorageAlert />
        {children}
        {hideLegal ? null : <LegalLinks className="mt-10" />}
      </main>

      <div
        data-focus-hide
        className="fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 md:hidden"
      >
        <NavPill
          items={navigation}
          pathname={pathname}
          layoutId="nav-bottom"
          variant="bottom"
          label="Mobile navigation"
        />
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
          className={cn("rounded-full", className)}
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
