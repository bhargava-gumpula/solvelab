"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectStackmatSimulator,
  disconnectedSession,
  getTimerDeviceAdapter,
  type TimerDeviceEvent,
  type TimerDeviceSession,
} from "@/lib/timer/devices";

const STORAGE_KEY = "solvelab.timerDevice.v1";

interface TimerDeviceContextValue {
  session: TimerDeviceSession;
  connectBluetooth: (options?: { preferSimulator?: boolean }) => Promise<TimerDeviceSession>;
  connectSimulator: () => Promise<TimerDeviceSession>;
  disconnect: () => Promise<void>;
}

const TimerDeviceContext = createContext<TimerDeviceContextValue | null>(null);

function readPreferredMode(): "simulator" | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "simulator" ? "simulator" : null;
  } catch {
    return null;
  }
}

function writePreferredMode(mode: "simulator" | null) {
  try {
    if (mode) sessionStorage.setItem(STORAGE_KEY, mode);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export function TimerDeviceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<TimerDeviceSession>(() => disconnectedSession());

  useEffect(() => {
    if (readPreferredMode() !== "simulator") return;
    const next = connectStackmatSimulator();
    setSession(next);
    return () => {
      void next.disconnect();
    };
  }, []);

  const disconnect = useCallback(async () => {
    writePreferredMode(null);
    await session.disconnect();
    setSession(disconnectedSession());
  }, [session]);

  const connectBluetooth = useCallback(
    async (options?: { preferSimulator?: boolean }) => {
      await session.disconnect().catch(() => {});
      const next = await getTimerDeviceAdapter("bluetooth").connect(options);
      writePreferredMode(next.mode === "simulator" ? "simulator" : null);
      setSession(next);
      return next;
    },
    [session],
  );

  const connectSimulator = useCallback(async () => {
    await session.disconnect().catch(() => {});
    const next = connectStackmatSimulator();
    writePreferredMode("simulator");
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
