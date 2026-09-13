"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useCommands } from "@/hooks/use-commands";

const TIMER_BASICS = [
  { label: "Start: hold, then release", keys: ["Space"] },
  { label: "Stop the timer", keys: ["Any key"] },
  { label: "Cancel inspection", keys: ["Esc"] },
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const commands = useCommands().filter((command) => command.shortcut);
  const rows = [
    ...TIMER_BASICS,
    ...commands.map((command) => ({ label: command.label, keys: command.shortcut!.split(" ") })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Single-key shortcuts work when you are not typing and no solve is running.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid max-h-[60svh] gap-1 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span>{row.label}</span>
              <span className="flex gap-1">
                {row.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
