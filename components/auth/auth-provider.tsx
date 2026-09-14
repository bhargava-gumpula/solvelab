"use client";

import { useSyncExternalStore } from "react";
import {
  AUTH_SERVER_SNAPSHOT,
  getAuthSnapshot,
  startAuthListener,
  subscribeAuth,
} from "@/lib/auth/session";

export function useAuth() {
  return useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => AUTH_SERVER_SNAPSHOT);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  startAuthListener();
  return children;
}
