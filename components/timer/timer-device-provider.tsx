"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  connectStackmatSimulator,
  disconnectedSession,
  getTimerDeviceAdapter,
  type TimerDeviceEvent,
  type TimerDeviceSession,
} from "@/lib/timer/devices";

interface TimerDeviceContextValue {
  session: TimerDeviceSession;
  connectBluetooth: (options?: { preferSimulator?: boolean }) => Promise<TimerDeviceSession>;
  connectSimulator: () => Promise<TimerDeviceSession>;
  disconnect: () => Promise<void>;
}

const TimerDeviceContext = createContext<TimerDeviceContextValue | null>(null);

export function TimerDeviceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TimerDeviceSession>(() => disconnectedSession());

  const disconnect = useCallback(async () => {
    await session.disconnect();
    setSession(disconnectedSession());
  }, [session]);

  const connectBluetooth = useCallback(
    async (options?: { preferSimulator?: boolean }) => {
      await session.disconnect().catch(() => {});
      const next = await getTimerDeviceAdapter("bluetooth").connect(options);
      setSession(next);
      return next;
    },
    [session],
  );

  const connectSimulator = useCallback(async () => {
    await session.disconnect().catch(() => {});
    const next = connectStackmatSimulator();
    setSession(next);
    return next;
  }, [session]);

  const value = useMemo(
    () => ({ session, connectBluetooth, connectSimulator, disconnect }),
    [session, connectBluetooth, connectSimulator, disconnect],
  );

  return <TimerDeviceContext.Provider value={value}>{children}</TimerDeviceContext.Provider>;
}

export function useTimerDevice(): TimerDeviceContextValue {
  const ctx = useContext(TimerDeviceContext);
  if (!ctx) {
    throw new Error("useTimerDevice requires TimerDeviceProvider");
  }
  return ctx;
}

export type { TimerDeviceEvent };
