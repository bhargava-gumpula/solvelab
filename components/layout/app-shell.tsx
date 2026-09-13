"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Settings2, Box, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/config/brand";
import { navigation } from "@/lib/config/navigation";
import { StorageAlert } from "./storage-alert";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const pageName = navigation.find(item => pathname.startsWith(item.href))?.label ?? "Settings";
  return <SidebarProvider style={{ "--sidebar-width": "14.5rem" } as React.CSSProperties}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <Sidebar className="app-sidebar">
      <SidebarHeader className="brand-header"><Link href="/timer" className="brand"><span className="brand-mark"><Box size={22} strokeWidth={1.7} /></span>{brand.name}<span className="brand-period">.</span></Link></SidebarHeader>
      <SidebarContent className="sidebar-body"><p className="eyebrow sidebar-caption">Your practice space</p>
        <SidebarMenu>{navigation.map(({ href, label, icon: Icon }) => <SidebarMenuItem key={href}>
          <SidebarMenuButton asChild isActive={pathname.startsWith(href)} className="app-nav-item"><Link href={href} aria-current={pathname.startsWith(href) ? "page" : undefined}><Icon /><span>{label}</span>{pathname.startsWith(href) && <span className="nav-active-mark" />}</Link></SidebarMenuButton>
        </SidebarMenuItem>)}</SidebarMenu>
        <div className="sidebar-note"><span className="tiny-rule" /><p>Small improvements.<br />Faster solves.</p><span>One session at a time.</span></div>
      </SidebarContent>
      <SidebarFooter className="sidebar-footer"><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === "/settings"} className="app-nav-item"><Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined}><Settings2 /><span>Settings</span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu><div className="local-note"><ShieldCheck size={15} /><span>Local first. Yours always.</span></div></SidebarFooter>
    </Sidebar>
    <div className="app-main">
      <header className="topbar"><div className="breadcrumb"><span className="mobile-brand"><Box size={20} />{brand.name}</span><span className="desktop-breadcrumb">Practice <span>/</span></span><span>{pageName}</span></div><div className="topbar-actions"><span className="phase-label">Foundation preview</span><Button variant="ghost" size="icon" aria-label="Toggle light or dark theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}><Sun className="theme-sun" size={18}/><Moon className="theme-moon" size={18}/></Button><Button variant="ghost" size="icon" asChild className="mobile-settings"><Link href="/settings" aria-label="Settings" aria-current={pathname === "/settings" ? "page" : undefined}><Settings2 size={18}/></Link></Button></div></header>
      <main id="main-content" tabIndex={-1} className="page-content"><StorageAlert/>{children}</main>
      <footer className="app-footer"><span>{brand.shortTagline}</span><Link href="/settings">{brand.version} · Design foundation <ArrowUpRight size={13} /></Link></footer>
    </div>
    <nav className="mobile-nav" aria-label="Main navigation">{navigation.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={pathname.startsWith(href) ? "page" : undefined}><Icon size={20}/><span>{label}</span></Link>)}</nav>
  </SidebarProvider>;
}
