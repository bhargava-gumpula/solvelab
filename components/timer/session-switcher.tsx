"use client";

import { useState } from "react";
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
import { getRepositories } from "@/lib/storage";
import type { Session } from "@/types/domain";
import { SessionManagerDialog } from "./session-manager-dialog";

export function SessionSwitcher({ active }: { active: Session | undefined }) {
  const sessions = useSessions();
  const [managerOpen, setManagerOpen] = useState(false);
  const [createOnOpen, setCreateOnOpen] = useState(false);

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="max-w-64 justify-between gap-2"
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
              <span className="truncate">{session.name}</span>
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
