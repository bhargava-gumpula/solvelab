"use client";

import { useEffect } from "react";
import { setUpServiceWorker } from "@/lib/offline/service-worker";

/** Sets up offline reloads once the page has loaded, so it never competes with first paint. */
export function ServiceWorker() {
  useEffect(() => {
    const start = () => void setUpServiceWorker().catch(() => undefined);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);
  return null;
}
