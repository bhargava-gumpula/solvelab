"use client";

/*
 * Route transitions with React's <ViewTransition> (App Router runs React
 * canary; see node_modules/next/dist/docs/01-app/02-guides/view-transitions.md).
 * Keying on the pathname makes every navigation an exit/enter pair; the CSS
 * for ".studio-page" lives in app/globals.css. Timer state changes never go
 * through transitions, so solving is unaffected.
 */
import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="studio-page" exit="studio-page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
