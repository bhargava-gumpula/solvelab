"use client";

import { AppearanceProvider } from "@/components/appearance/appearance-provider";
import { AppearanceSync } from "@/components/appearance/appearance-sync";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SignInReturn } from "@/components/auth/sign-in-return";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountSyncProvider } from "./account-sync-provider";
import { StorageProvider } from "./storage-provider";
import { TimerDeviceProvider } from "@/components/timer/timer-device-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <TooltipProvider delayDuration={250}>
        <AuthProvider>
          <SignInReturn />
          <StorageProvider>
            <AppearanceSync />
            <TimerDeviceProvider>
              <AccountSyncProvider>{children}</AccountSyncProvider>
            </TimerDeviceProvider>
          </StorageProvider>
        </AuthProvider>
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </AppearanceProvider>
  );
}
