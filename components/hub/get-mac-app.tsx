"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Bot, Copy, Download, Laptop, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { GoogleIcon } from "@/components/auth/google-icon";
import { HowToOpen } from "@/components/hub/how-to-open";
import { Button } from "@/components/ui/button";
import { useHub } from "@/hooks/use-hub";
import type { CoachContextInput } from "@/lib/ai/context";
import { profileSummary } from "@/lib/ai/summary";
import { googleSignInErrorMessage, signInWithGoogle } from "@/lib/auth/actions";
import { accessState } from "@/lib/auth/access";
import { MAC_APP, visitorDevice } from "@/lib/config/mac-app";

const subscribeNothing = () => () => undefined;

/**
 * What the AI coach is, why it needs the app, and a way to take your numbers elsewhere. The page
 * is public; only "Copy my summary" needs the account its numbers come from.
 */
export function GetMacApp() {
  // The server can't know the device, so it assumes a Mac and the note appears once loaded.
  const visitor = useSyncExternalStore(
    subscribeNothing,
    () => visitorDevice(navigator.userAgent, navigator.maxTouchPoints),
    () => "mac" as const,
  );
  const access = accessState(useAuth().status);
  const hub = useHub();
  const { profile, average, placement, current, intro } = hub;
  const summary = useMemo(() => {
    if (!profile) return null;
    const input: CoachContextInput = {
      profile,
      averageMs: average,
      course: placement?.course ?? null,
      picks:
        current?.units
          .filter((unit) => unit.pick)
          .map((unit) => ({ title: unit.unit.title, reason: unit.pick!.reason })) ?? [],
      intro,
    };
    return profileSummary(input);
  }, [profile, average, placement, current, intro]);

  const copy = async () => {
    try {
      // navigator.clipboard is missing outside a secure page, so this can throw at once.
      await navigator.clipboard.writeText(summary ?? "");
      toast.success("Copied. Paste it into any AI you like.");
    } catch {
      toast.error("Couldn’t copy. Open “What gets copied” and copy it from there.");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6" data-testid="get-mac-app">
      <header>
        <p className="flex items-center gap-2 eyebrow text-primary">
          <Bot className="size-4" aria-hidden /> AI coach
        </p>
        <h1 className="mt-1 font-display text-[2.9rem] leading-[0.98]">Get the Mac app</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          The AI coach lives in the SolveLab Mac app. It runs on your Mac, so it&apos;s free and
          your questions never leave it. The website keeps everything else.
        </p>
      </header>

      {visitor === "other" ? (
        <p className="tile p-4 text-sm" role="note" data-testid="mac-only-note">
          <Laptop className="mr-2 inline size-4 text-primary" aria-hidden />
          The coach is Mac only, so it can&apos;t run on this device. The timer, Learning Hub and
          everything else work here as usual.
        </p>
      ) : null}

      <section className="tile grid gap-3 p-5 md:p-6" aria-labelledby="mac-download">
        <h2 id="mac-download" className="flex items-center gap-2 text-base font-semibold">
          <Download className="size-4 text-primary" aria-hidden /> Download
        </h2>
        {MAC_APP.downloadUrl ? (
          <Button asChild className="w-fit">
            <a href={MAC_APP.downloadUrl} data-testid="mac-download">
              Download for Mac
            </a>
          </Button>
        ) : (
          <p data-testid="mac-coming">
            <strong>Coming with 6.0.</strong> The download isn&apos;t out yet. The link will be on
            this page the day it is.
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          The app is free. It isn&apos;t signed with an Apple Developer ID, so macOS warns you the
          first time you open it; follow{" "}
          <a href="#how-to-open" className="underline underline-offset-2">
            a short guide
          </a>{" "}
          below. On a school or parent-managed Mac, ask whoever manages it.
        </p>
      </section>

      <HowToOpen />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="tile grid content-start gap-2 p-5 md:p-6" aria-labelledby="mac-does">
          <h2 id="mac-does" className="text-base font-semibold">
            What the coach does
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Reads your solve profile, goal, course and Learning Hub path.</li>
            <li>
              Answers questions in plain words: why you&apos;re stuck and what to do this week.
            </li>
            <li>
              Points only to SolveLab&apos;s real training packs and tests, and flags names that
              don&apos;t exist.
            </li>
          </ul>
        </section>

        <section className="tile grid content-start gap-2 p-5 md:p-6" aria-labelledby="mac-private">
          <h2 id="mac-private" className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4 text-primary" aria-hidden /> Private, on your Mac
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Your questions, the replies and your numbers go only to the model on your Mac.</li>
            <li>Chats are kept on your Mac and are deleted when you sign out of the app.</li>
            <li>
              The model is downloaded from Ollama&apos;s servers. That download sends no SolveLab
              data.
            </li>
          </ul>
        </section>
      </div>

      <section className="tile grid gap-2 p-5 md:p-6" aria-labelledby="mac-needs">
        <h2 id="mac-needs" className="text-base font-semibold">
          What you need
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>{MAC_APP.requirements.chip}</li>
          <li>{MAC_APP.requirements.os}</li>
          <li>{MAC_APP.requirements.disk}</li>
          <li>{MAC_APP.requirements.admin}</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Bluetooth timers stay on the website, in Chrome.
        </p>
      </section>

      <section className="tile grid gap-3 p-5 md:p-6" aria-labelledby="mac-copy">
        <div>
          <h2 id="mac-copy" className="text-base font-semibold">
            No Mac? Take your numbers with you
          </h2>
          <p className="text-sm text-muted-foreground">
            Copies a short summary of your solve profile, numbers only and never your name, email or
            notes, to paste into any AI you already use. SolveLab sends it nowhere; what you paste
            is between you and that service.
          </p>
        </div>
        {access === "locked" ? (
          <div className="grid gap-2" data-testid="copy-sign-in">
            <p className="text-sm text-muted-foreground">
              Sign in to copy your summary. It&apos;s built from the solve profile kept on your
              account.
            </p>
            <Button
              className="w-fit"
              variant="outline"
              onClick={() => {
                void signInWithGoogle().catch((error: unknown) =>
                  toast.error(googleSignInErrorMessage(error)),
                );
              }}
            >
              <GoogleIcon className="size-4" />
              Sign in with Google
            </Button>
          </div>
        ) : (
          <>
            <Button
              className="w-fit"
              onClick={() => void copy()}
              disabled={!summary || access !== "open"}
              data-testid="copy-summary"
            >
              <Copy /> Copy my summary
            </Button>
            <details className="text-xs text-muted-foreground">
              <summary className="w-fit cursor-pointer hover:text-foreground">
                What gets copied
              </summary>
              <pre
                className="mt-2 max-h-72 overflow-auto rounded-xl bg-background/60 p-3 whitespace-pre-wrap"
                data-testid="summary-preview"
              >
                {summary ?? "Loading your profile…"}
              </pre>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
