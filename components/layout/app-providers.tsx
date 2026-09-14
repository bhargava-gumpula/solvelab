"use client";

import { AppearanceProvider } from "@/components/appearance/appearance-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SignInReturn } from "@/components/auth/sign-in-return";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountSyncProvider } from "./account-sync-provider";
import { StorageProvider } from "./storage-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <TooltipProvider delayDuration={250}>
        <AuthProvider>
          <SignInReturn />
          <StorageProvider>
            <AccountSyncProvider>{children}</AccountSyncProvider>
          </StorageProvider>
        </AuthProvider>
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </AppearanceProvider>
  );
}
