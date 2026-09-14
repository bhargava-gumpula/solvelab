"use client";

import { useMemo } from "react";
import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRegisterCommands } from "@/hooks/use-commands";
import { googleSignInErrorMessage, signInWithGoogle, signOutAccount } from "@/lib/auth/actions";
import type { Command } from "@/lib/commands/registry";
import { useAuth } from "./auth-provider";
import { GoogleIcon } from "./google-icon";

async function handleGoogleSignIn() {
  try {
    await signInWithGoogle();
  } catch (error) {
    toast.error(googleSignInErrorMessage(error));
  }
}

export function AccountButton() {
  const { status, user } = useAuth();
  const commands = useMemo<Command[]>(
    () =>
      status === "signedIn"
        ? [
            {
              id: "sign-out",
              label: "Sign out",
              group: "Account",
              icon: LogOut,
              run: () => void signOutAccount(),
            },
          ]
        : [
            {
              id: "sign-in",
              label: "Sign in with Google",
              group: "Account",
              icon: LogIn,
              keywords: ["account", "google", "login"],
              run: () => void handleGoogleSignIn(),
            },
          ],
    [status],
  );
  useRegisterCommands("account", commands);

  if (status === "signedIn" && user) {
    const initial = (user.displayName ?? user.email ?? "?").slice(0, 1).toUpperCase();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="Account">
            <Avatar size="sm">
              {user.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-sm font-medium">
              {user.displayName ?? "Signed in"}
            </span>
            {user.email ? (
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void signOutAccount()}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          aria-label="Sign in with Google"
          onClick={() => void handleGoogleSignIn()}
          disabled={status === "loading"}
        >
          {status === "signedOut" || status === "unconfigured" ? (
            <GoogleIcon className="size-4" />
          ) : (
            <LogIn />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Sign in with Google</TooltipContent>
    </Tooltip>
  );
}
