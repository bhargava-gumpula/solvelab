/**
 * Personal-best celebration using canvas-confetti (the engine behind Magic UI's
 * Confetti on 21st.dev). Loaded on demand; colors follow the active theme.
 */
export async function celebrate(
  origin: { x: number; y: number } = { x: 0.5, y: 0.45 },
  { tone = "theme" }: { tone?: "theme" | "gold" | "ink" } = {},
) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  const styles = getComputedStyle(document.documentElement);
  const hex = (tokens: string[]) =>
    tokens
      .map((token) => styles.getPropertyValue(token).trim())
      .filter((value) => /^#[0-9a-f]{3,8}$/i.test(value));

  if (tone === "gold" || tone === "ink") {
    // Studio: paper confetti in the theme's ink, gold and accents, drifting down slowly
    // from the digits. A single PB is a full burst; an average PB a smaller one.
    const colors =
      tone === "gold"
        ? [...hex(["--gold", "--gold", "--primary", "--accent-2", "--foreground"]), "#fff3c4"]
        : hex(["--primary", "--primary", "--accent-2", "--foreground", "--gold"]);
    const shared = {
      origin,
      colors,
      zIndex: 80,
      disableForReducedMotion: true,
      // Low, sideways and short: the burst stays around the digits, off the next scramble.
      ticks: 230,
      gravity: 0.8,
      decay: 0.92,
      scalar: 0.78,
      shapes: ["square", "circle"] as ("square" | "circle")[],
    };
    const big = tone === "gold";
    // Two bursts from either side of the digits, thrown outward, so the particles fall
    // down the edges and keep clear of the time, the averages row and the next scramble.
    const side = (dx: number) => ({
      x: Math.min(0.95, Math.max(0.05, origin.x + dx)),
      y: origin.y,
    });
    confetti({
      ...shared,
      origin: side(-0.2),
      particleCount: big ? 40 : 22,
      spread: 55,
      startVelocity: 20,
      angle: 160,
      ticks: 200,
    });
    confetti({
      ...shared,
      origin: side(0.13),
      particleCount: big ? 40 : 22,
      spread: 55,
      startVelocity: 13,
      angle: 20,
      ticks: 200,
    });
    return;
  }
  const colors = hex(["--primary", "--accent-2", "--timer-armed", "--warning"]);
  const shared = {
    origin,
    ...(colors.length > 0 && { colors }),
    zIndex: 80,
    disableForReducedMotion: true,
    ticks: 180,
  };
  confetti({ ...shared, particleCount: 70, spread: 70, startVelocity: 38, scalar: 0.9 });
  setTimeout(
    () => confetti({ ...shared, particleCount: 40, spread: 110, startVelocity: 26, scalar: 0.7 }),
    140,
  );
}
