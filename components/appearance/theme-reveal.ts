/*
 * Theme change as a circular reveal: the new theme grows out of the point you
 * clicked, like the page being re-inked. A document view transition captures
 * the old page, the theme is applied synchronously, and only the root
 * snapshot animates (every named part joins the root for this one
 * transition). Idea from Magic UI's animated-theme-toggler (MIT), rewritten.
 * Falls back to an instant switch without view transitions or with reduced motion.
 */
import { flushSync } from "react-dom";
import { resolveTheme, type AppearancePreferences } from "@/lib/appearance/preferences";
import { getTheme } from "@/lib/appearance/themes";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/** The click point, or the centre of the element for keyboard activation. */
export function revealOrigin(event: React.MouseEvent<HTMLElement>): { x: number; y: number } {
  if (event.detail > 0) return { x: event.clientX, y: event.clientY };
  const rect = event.currentTarget.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function revealTheme(
  choice: AppearancePreferences["theme"],
  origin: { x: number; y: number } | null,
  apply: () => void,
) {
  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const next = getTheme(
    resolveTheme(choice, window.matchMedia("(prefers-color-scheme: dark)").matches),
  );
  if (!doc.startViewTransition || reduce || root.dataset.theme === next.id) {
    apply();
    return;
  }
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? 0;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  root.style.setProperty("--reveal-x", `${x}px`);
  root.style.setProperty("--reveal-y", `${y}px`);
  root.style.setProperty("--reveal-r", `${Math.ceil(radius)}px`);
  root.dataset.themeReveal = "";
  const transition = doc.startViewTransition(() => {
    root.dataset.theme = next.id;
    root.classList.toggle("dark", next.mode === "dark");
    root.classList.toggle("light", next.mode === "light");
    flushSync(apply);
  });
  void transition.finished.finally(() => {
    delete root.dataset.themeReveal;
  });
}
