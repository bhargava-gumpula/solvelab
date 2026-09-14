"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, FolderCog, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessions } from "@/hooks/use-local-data";
import { eventInfo } from "@/lib/cube/events";
import { getRepositories } from "@/lib/storage";
import type { Session } from "@/types/domain";
import { SessionManagerDialog } from "./session-manager-dialog";

export const SESSION_MENU_EVENT = "solvelab:session-menu";
export const NEW_SESSION_EVENT = "solvelab:new-session";

export function SessionSwitcher({ active }: { active: Session | undefined }) {
  const sessions = useSessions();
  const [managerOpen, setManagerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOnOpen, setCreateOnOpen] = useState(false);

  // Keyboard shortcuts and the command palette open the menu or manager via events.
  useEffect(() => {
    const openMenu = () => setMenuOpen(true);
    const newSession = () => {
      setCreateOnOpen(true);
      setManagerOpen(true);
    };
    window.addEventListener(SESSION_MENU_EVENT, openMenu);
    window.addEventListener(NEW_SESSION_EVENT, newSession);
    return () => {
      window.removeEventListener(SESSION_MENU_EVENT, openMenu);
      window.removeEventListener(NEW_SESSION_EVENT, newSession);
    };
  }, []);

  const switchTo = async (id: string) => {
    try {
      await getRepositories().sessions.setActive(id);
    } catch {
      toast.error("Couldn’t switch sessions");
    }
  };

  const openManager = (create: boolean) => {
    setCreateOnOpen(create);
    setManagerOpen(true);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-9 max-w-64 justify-between gap-2 rounded-full px-3.5 glass"
            aria-label="Current session"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            <span className="truncate">{active?.name ?? "Loading…"}</span>
            <ChevronsUpDown className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Sessions
          </DropdownMenuLabel>
          {sessions?.map((session) => (
            <DropdownMenuItem key={session.id} onSelect={() => switchTo(session.id)}>
              <Check className={session.id === active?.id ? "opacity-100" : "opacity-0"} />
              <span className="min-w-0 flex-1 truncate">{session.name}</span>
              {session.event !== "333" && session.name !== eventInfo(session.event).label && (
                <span className="text-xs text-muted-foreground">
                  {eventInfo(session.event).shortLabel}
                </span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openManager(true)}>
            <Plus />
            New session
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openManager(false)}>
            <FolderCog />
            Manage sessions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SessionManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        startCreating={createOnOpen}
        activeSessionId={active?.id}
      />
    </>
  );
}
