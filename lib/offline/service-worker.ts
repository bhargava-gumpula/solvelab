import { features } from "@/lib/config/features";

/**
 * Registers `public/sw.js`, which lets the timer reload without a network.
 *
 * Only in a production build: in development the worker would keep serving
 * old pages over the dev server. With `features.offline` off, any worker a
 * visitor already has is removed, so turning it off is a one-line release.
 */
export async function setUpServiceWorker(
  env: { production: boolean; base: string; enabled: boolean } = {
    production: process.env.NODE_ENV === "production",
    base: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
    enabled: features.offline,
  },
): Promise<"registered" | "removed" | "skipped"> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return "skipped";
  if (!env.production || !env.enabled) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    return registrations.length ? "removed" : "skipped";
  }
  await navigator.serviceWorker.register(`${env.base}/sw.js`, { scope: `${env.base}/` });
  return "registered";
}
