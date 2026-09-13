"use client";

import { useEffect, useSyncExternalStore } from "react";
import { commandRegistry, type Command } from "@/lib/commands/registry";

const EMPTY: readonly Command[] = [];

export function useRegisterCommands(sourceId: string, commands: readonly Command[]) {
  useEffect(() => commandRegistry.register(sourceId, commands), [sourceId, commands]);
}

export function useCommands(): readonly Command[] {
  return useSyncExternalStore(commandRegistry.subscribe, commandRegistry.getSnapshot, () => EMPTY);
}
