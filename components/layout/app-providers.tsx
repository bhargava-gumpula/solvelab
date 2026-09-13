"use client";
import { ThemeProvider } from "next-themes";
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>{children}</ThemeProvider>;
}
