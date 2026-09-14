"use client";

import { Box, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CUBE_EVENTS, EVENT_GROUPS, eventInfo } from "@/lib/cube/events";
import { getRepositories } from "@/lib/storage";
import type { CubeEvent, Session } from "@/types/domain";

interface EventSwitcherProps {
  session: Session | undefined;
  disabled?: boolean;
}

/** Puzzle-type picker. Switching events never mixes times in a session that already has solves. */
export function EventSwitcher({ session, disabled }: EventSwitcherProps) {
  const current = session ? eventInfo(session.event) : eventInfo("333");

  const select = async (event: CubeEvent) => {
    if (!session || event === session.event) return;
    try {
      await getRepositories().sessions.selectEvent(session.id, event);
    } catch {
      toast.error("Couldn’t switch puzzle type");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled || !session}
          className="h-9 justify-between gap-2 rounded-full px-3.5 glass"
          aria-label="Puzzle type"
          data-testid="event-switcher"
        >
          <Box className="size-4 text-primary" aria-hidden />
          {current.shortLabel}
          <ChevronsUpDown className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {EVENT_GROUPS.map((group, index) => (
          <div key={group}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {group}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={session?.event}
              onValueChange={(value) => void select(value as CubeEvent)}
            >
              {CUBE_EVENTS.filter((event) => event.group === group).map((event) => (
                <DropdownMenuRadioItem key={event.id} value={event.id} aria-label={event.label}>
                  {event.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
