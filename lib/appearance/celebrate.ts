/**
 * Personal-best celebration using canvas-confetti (the engine behind Magic UI's
 * Confetti on 21st.dev). Loaded on demand; colors follow the active theme.
 */
export async function celebrate(origin: { x: number; y: number } = { x: 0.5, y: 0.45 }) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  const styles = getComputedStyle(document.documentElement);
  const colors = ["--primary", "--accent-2", "--timer-armed", "--warning"]
    .map((token) => styles.getPropertyValue(token).trim())
    .filter(Boolean);
  const shared = { origin, colors, zIndex: 80, disableForReducedMotion: true, ticks: 180 };
  confetti({ ...shared, particleCount: 70, spread: 70, startVelocity: 38, scalar: 0.9 });
  setTimeout(
    () => confetti({ ...shared, particleCount: 40, spread: 110, startVelocity: 26, scalar: 0.7 }),
    140,
  );
}
