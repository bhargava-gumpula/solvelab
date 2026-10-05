"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isTauri, updateCheck, updateInstall } from "@/lib/desktop/tauri";

/**
 * Mac app only: one check for a newer version when the app opens. If there is one, a small note
 * asks "Update available, restart?". It never takes focus, so Space stays with the timer, and it
 * says nothing when the Mac is offline or no release is published.
 */
export function UpdatePrompt() {
  const [version, setVersion] = useState<string | null>(null);
  const [state, setState] = useState<"ask" | "installing" | "failed">("ask");

  useEffect(() => {
    if (!isTauri()) return;
    let live = true;
    updateCheck()
      .then((next) => {
        if (live) setVersion(next);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (!version) return null;

  const install = () => {
    setState("installing");
    // On success the app restarts. It resolves only if the update vanished meanwhile: hide the note.
    updateInstall().then(
      () => setVersion(null),
      () => setState("failed"),
    );
  };

  return (
    <div
      role="status"
      className="tile fixed right-4 bottom-4 z-50 flex max-w-sm flex-wrap items-center gap-3 p-3 text-sm shadow-lg"
      data-testid="update-prompt"
    >
      <p className="min-w-0 flex-1">
        {state === "failed"
          ? "Couldn’t update. You can keep using this version."
          : state === "installing"
            ? `Updating to ${version}…`
            : `Update available (${version}). Restart?`}
      </p>
      {state === "ask" ? (
        <Button size="sm" onClick={install}>
          Restart
        </Button>
      ) : null}
      {state !== "installing" ? (
        <Button size="sm" variant="ghost" onClick={() => setVersion(null)}>
          {state === "failed" ? "Close" : "Later"}
        </Button>
      ) : null}
    </div>
  );
}
