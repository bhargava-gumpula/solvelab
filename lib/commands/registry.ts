/**
 * A small registry of user actions shared by the command palette and the
 * keyboard-shortcut help. Features register the commands they own while
 * mounted (the timer registers timer commands, the shell registers navigation).
 */
import type { LucideIcon } from "lucide-react";

export interface Command {
  id: string;
  label: string;
  group: "Timer" | "Scramble" | "Session" | "Navigate" | "Appearance" | "Data" | "Account";
  /** Human-readable shortcut, shown in the palette and help sheet. */
  shortcut?: string;
  icon?: LucideIcon;
  keywords?: string[];
  run: () => void;
}

type Listener = () => void;

const sources = new Map<string, readonly Command[]>();
const listeners = new Set<Listener>();
let snapshot: readonly Command[] = [];

function emit() {
  snapshot = [...sources.values()].flat();
  listeners.forEach((listener) => listener());
}

export const commandRegistry = {
  register(sourceId: string, commands: readonly Command[]) {
    sources.set(sourceId, commands);
    emit();
    return () => {
      sources.delete(sourceId);
      emit();
    };
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => snapshot,
};
