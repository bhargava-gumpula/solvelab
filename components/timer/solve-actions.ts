"use client";

import { toast } from "sonner";
import type { Penalty, Solve } from "@/types/domain";
import { getRepositories } from "@/lib/storage";

export async function setSolvePenalty(solve: Solve, penalty: Penalty) {
  try {
    await getRepositories().solves.update(solve.id, { penalty });
  } catch {
    toast.error("Couldn’t update the penalty");
  }
}

/** Deletes a solve and offers a short undo that restores it exactly. */
export async function deleteSolveWithUndo(solve: Solve) {
  const { solves, db } = getRepositories();
  try {
    await solves.delete(solve.id);
  } catch {
    toast.error("Couldn’t delete the solve");
    return;
  }
  toast("Solve deleted", {
    action: {
      label: "Undo",
      onClick: () => {
        db.solves.put(solve).catch(() => toast.error("Couldn’t restore the solve"));
      },
    },
  });
}
