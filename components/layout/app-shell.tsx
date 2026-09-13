"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { brand } from "@/lib/config/brand";
import {
  isActivePath,
  navigation,
  settingsNavigation,
  type NavigationItem,
} from "@/lib/config/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { StorageAlert } from "./storage-alert";
import { ThemeToggle } from "./theme-toggle";

/*
 * Shell composition adapted from the 21st.dev shadcn Sidebar (MIT), built on
 * the project's installed shadcn sidebar primitives. See docs/DESIGN.md.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current =
    [...navigation, settingsNavigation].find((item) => isActivePath(pathname, item.href))?.label ??
    "";

  return (
    <SidebarProvider style={{ "--sidebar-width": "14rem" } as React.CSSProperties}>
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-md bg-foreground px-4 py-2 text-sm text-background focus:translate-y-0"
      >
        Skip to content
      </a>

      <Sidebar collapsible="icon" data-focus-hide className="border-sidebar-border">
        <SidebarHeader className="px-3 pt-5 pb-6 group-data-[collapsible=icon]:px-2">
          <Link
            href="/timer"
            className="flex items-center gap-2.5 rounded-md px-2 text-lg font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <BrandMark className="size-6 shrink-0 text-primary" />
            <span className="group-data-[collapsible=icon]:hidden">{brand.name}</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <nav aria-label="Main navigation">
            <SidebarMenu>
              {navigation.map((item) => (
                <NavItem key={item.href} item={item} active={isActivePath(pathname, item.href)} />
              ))}
            </SidebarMenu>
          </nav>
        </SidebarContent>

        <SidebarFooter className="gap-3 px-2 pb-4">
          <SidebarMenu>
            <NavItem
              item={settingsNavigation}
              active={isActivePath(pathname, settingsNavigation.href)}
            />
          </SidebarMenu>
          <p className="flex items-center gap-2 border-t border-sidebar-border px-2 pt-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
            Stored on this device
          </p>
        </SidebarFooter>
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          data-focus-hide
          className="flex h-14 items-center justify-between gap-3 border-b px-4 md:px-6"
        >
          <div className="flex items-center gap-3 text-sm">
            <SidebarTrigger className="hidden md:inline-flex" aria-label="Toggle navigation" />
            <Link href="/timer" className="flex items-center gap-2 font-semibold md:hidden">
              <BrandMark className="size-5 text-primary" />
              {brand.name}
            </Link>
            <span className="hidden text-muted-foreground md:inline">{current}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 hidden rounded-md border px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              {brand.version} · {brand.versionLabel}
            </span>
            <ThemeToggle />
            <Link
              href={settingsNavigation.href}
              aria-label="Settings"
              aria-current={isActivePath(pathname, settingsNavigation.href) ? "page" : undefined}
              className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent md:hidden"
            >
              <settingsNavigation.icon className="size-4" />
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-5 pb-28 outline-none md:px-6 md:pt-6 md:pb-10"
        >
          <StorageAlert />
          {children}
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        data-focus-hide
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t bg-sidebar/95 px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] text-muted-foreground",
                active && "text-primary",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </SidebarProvider>
  );
}

function NavItem({ item, active }: { item: NavigationItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="h-9">
        <Link href={item.href} aria-current={active ? "page" : undefined}>
          <Icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
