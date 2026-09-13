"use client";
import { ThemeProvider } from "next-themes";
import { StorageProvider } from "./storage-provider";
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange><StorageProvider>{children}</StorageProvider></ThemeProvider>;
}
