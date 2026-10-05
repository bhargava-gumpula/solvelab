"use client";

import { MotionConfig } from "motion/react";
import { AppearanceProvider } from "@/components/appearance/appearance-provider";
import { AppearanceSync } from "@/components/appearance/appearance-sync";
import { AuthProvider } from "@/components/auth/auth-provider";
import { DesktopSignInLink } from "@/components/auth/desktop-sign-in-link";
import { SignInReturn } from "@/components/auth/sign-in-return";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountSyncProvider } from "./account-sync-provider";
import { ServiceWorker } from "./service-worker";
import { StorageProvider } from "./storage-provider";
import { TimerDeviceProvider } from "@/components/timer/timer-device-provider";
import { TrainingDataSync } from "@/components/training-data/training-data-sync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      {/* Reduced motion drops movement site-wide and keeps fades. */}
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={250}>
          <AuthProvider>
            <SignInReturn />
            <DesktopSignInLink />
            <StorageProvider>
              <AppearanceSync />
              <TrainingDataSync />
              <TimerDeviceProvider>
                <AccountSyncProvider>{children}</AccountSyncProvider>
              </TimerDeviceProvider>
            </StorageProvider>
          </AuthProvider>
          <Toaster position="bottom-center" />
          <ServiceWorker />
        </TooltipProvider>
      </MotionConfig>
    </AppearanceProvider>
  );
}
