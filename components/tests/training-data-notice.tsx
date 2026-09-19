"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-local-data";
import { isAuthConfigured } from "@/lib/auth/config";
import { getRepositories } from "@/lib/storage";
import { setTrainingDataSharing, sharingChangeMessage } from "@/lib/training-data/controls";

/** One-time note that finished tests help train the coach, with a way to opt out. */
export function TrainingDataNotice() {
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  if (!settings || !isAuthConfigured()) return null;
  if (settings.trainingNoticeSeen || !settings.contributeTrainingData) return null;

  const dismiss = () => void getRepositories().settings.update({ trainingNoticeSeen: true });
  const turnOff = async () => {
    setBusy(true);
    const change = await setTrainingDataSharing(false);
    toast(sharingChangeMessage(false, change));
    setBusy(false);
  };

  return (
    <aside
      aria-label="How your test results are used"
      data-testid="training-data-notice"
      data-focus-hide
      className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center"
    >
      <HeartHandshake className="size-5 shrink-0 text-primary" aria-hidden />
      <p className="flex-1 text-sm">
        <span className="font-medium">Your finished tests help improve the coach.</span>{" "}
        <span className="text-muted-foreground">
          We share attempt times, the test, your goal and the day. Never your name, email, notes or
          scrambles.{" "}
          <Link href="/privacy/#coach-training" className="underline underline-offset-4">
            Privacy
          </Link>
        </span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="ghost" onClick={() => void turnOff()} disabled={busy}>
          Don’t share
        </Button>
        <Button size="sm" onClick={dismiss} disabled={busy}>
          Got it
        </Button>
      </div>
    </aside>
  );
}
