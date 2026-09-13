"use client";

import { AppearanceProvider } from "@/components/appearance/appearance-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StorageProvider } from "./storage-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <TooltipProvider delayDuration={250}>
        <StorageProvider>{children}</StorageProvider>
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </AppearanceProvider>
  );
}
