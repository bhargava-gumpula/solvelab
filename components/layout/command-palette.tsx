"use client";

import { Fragment } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCommands } from "@/hooks/use-commands";
import type { Command } from "@/lib/commands/registry";

const GROUP_ORDER: Command["group"][] = [
  "Timer",
  "Scramble",
  "Session",
  "Navigate",
  "Appearance",
  "Data",
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const commands = useCommands();
  const groups = GROUP_ORDER.map(
    (group) => [group, commands.filter((command) => command.group === group)] as const,
  ).filter(([, items]) => items.length > 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search for an action"
      className="bg-popover glass sm:max-w-lg"
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList className="max-h-[60svh]">
        <CommandEmpty>No matching actions.</CommandEmpty>
        {groups.map(([group, items], index) => (
          <Fragment key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((command) => {
                const Icon = command.icon;
                return (
                  <CommandItem
                    key={command.id}
                    value={`${command.label} ${command.keywords?.join(" ") ?? ""}`}
                    onSelect={() => {
                      onOpenChange(false);
                      // Let the dialog close (and return focus) before running.
                      setTimeout(command.run, 0);
                    }}
                  >
                    {Icon && <Icon className="text-muted-foreground" />}
                    <span>{command.label}</span>
                    {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
