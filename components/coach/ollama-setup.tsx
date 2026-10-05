"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Check, Circle, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { COACH_MODELS, OLLAMA_DOWNLOAD_URL, type CoachModel } from "@/lib/config/coach-model";
import {
  cancelPull,
  getPullState,
  resetPull,
  startPull,
  subscribePull,
} from "@/lib/desktop/ollama-pull";
import {
  diskTooSmall,
  fetchStatus,
  modelPlan,
  nextStep,
  NOT_RUNNING,
  type OllamaStatus,
  type SetupStep,
} from "@/lib/desktop/ollama-setup";
import {
  isTauri,
  macInfo,
  ollamaInstall,
  ollamaOpen,
  type InstallInfo,
  type MacInfo,
} from "@/lib/desktop/tauri";

const POLL_MS = 3000;
const gb = (bytes: number) => `${(bytes / 1e9).toFixed(1)} GB`;
const noSubscribe = () => () => {};

type Row = "done" | "current" | "todo";
const rowStates = (step: SetupStep): [Row, Row, Row] =>
  step === "ready"
    ? ["done", "done", "done"]
    : step === "download"
      ? ["done", "current", "todo"]
      : ["current", "todo", "todo"];

/**
 * First-run setup for the Mac app's coach: Ollama, then the model, then the coach itself.
 * Shows the steps and exactly one thing to do. Renders `children(model)` once the model is ready,
 * and goes back to the setup if Ollama stops. Renders nothing outside the Mac app.
 */
export function OllamaSetup({ children }: { children?: (model: CoachModel) => ReactNode }) {
  const desktop = useSyncExternalStore(noSubscribe, isTauri, () => false);
  if (!desktop) return null;
  return <Setup>{children}</Setup>;
}

function Setup({ children }: { children?: (model: CoachModel) => ReactNode }) {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [install, setInstall] = useState<InstallInfo | null>(null);
  const [mac, setMac] = useState<MacInfo | null>(null);
  const [wantBetter, setWantBetter] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const pull = useSyncExternalStore(subscribePull, getPullState, getPullState);

  const refresh = useCallback(async () => {
    const s = await fetchStatus();
    setStatus(s);
    if (!s.running) setInstall(await ollamaInstall().catch(() => null));
  }, []);

  useEffect(() => {
    const poll = () => {
      if (!document.hidden) void refresh();
    };
    const first = setTimeout(() => {
      void macInfo().then(setMac, () => undefined);
      void refresh();
    }, 0);
    const id = setInterval(poll, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [refresh]);

  const plan = modelPlan(mac?.ramBytes ?? null);
  const model = wantBetter && plan.better ? plan.better : plan.default;
  const current = status ?? NOT_RUNNING;
  const step = nextStep(current, install, model);

  if (status && step === "ready") return <>{children?.(model)}</>;

  const [r1, r2, r3] = rowStates(step);
  const pulling = pull.phase === "pulling" && pull.tag === model.tag;
  const noRoom = diskTooSmall(mac?.diskFreeBytes ?? null, model.sizeBytes);

  const open = async () => {
    setOpenError(null);
    try {
      await ollamaOpen();
    } catch {
      setOpenError("Couldn't open Ollama. Open it from your Applications folder.");
    }
    void refresh();
  };

  return (
    <section
      className="grid gap-5 rounded-xl border bg-card p-6"
      data-testid="ollama-setup"
      data-step={step}
    >
      <div>
        <h2 className="text-lg font-semibold">Set up the coach</h2>
        <p className="text-sm text-muted-foreground">
          The coach runs on your Mac with a free program called Ollama. Nothing about you leaves
          this Mac.
        </p>
      </div>

      <ol className="grid gap-4">
        <StepRow n={1} state={r1} title="Install and open Ollama">
          {step === "install" && (
            <>
              <p>
                Open the downloaded file, drag Ollama to Applications, then open it once. Installing
                may ask for an administrator password; on a school or parent-managed Mac, ask
                whoever manages it.
              </p>
              <Button asChild size="sm" className="w-fit">
                <a
                  href={OLLAMA_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="ollama-download-link"
                >
                  Download Ollama <ExternalLink />
                </a>
              </Button>
              <Waiting>Waiting for Ollama to start…</Waiting>
            </>
          )}
          {step === "open" && (
            <>
              <p>Ollama is installed but not running.</p>
              <Button size="sm" className="w-fit" onClick={open} data-testid="ollama-open">
                Open Ollama
              </Button>
              {openError && <p className="text-destructive">{openError}</p>}
            </>
          )}
          {step === "start-cli" && (
            <>
              <p>
                Ollama is installed without the app. Start it in Terminal with{" "}
                <code>ollama serve</code>.
              </p>
              <Waiting>Waiting for Ollama to start…</Waiting>
            </>
          )}
          {step === "update" && (
            <>
              <p>
                This Ollama ({current.version}) is too old for the coach&apos;s model. Update it,
                then open it again.
              </p>
              <Button asChild size="sm" className="w-fit">
                <a
                  href={OLLAMA_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="ollama-update-link"
                >
                  Update Ollama <ExternalLink />
                </a>
              </Button>
            </>
          )}
          {r1 === "done" && <p>Ollama {current.version} is running.</p>}
          {step === "install" || step === "open" || step === "start-cli" ? (
            <p className="text-xs">Ollama must use its default address (127.0.0.1:11434).</p>
          ) : null}
        </StepRow>

        <StepRow n={2} state={r2} title={`Download the coach model (${gb(model.sizeBytes)})`}>
          {step === "download" && (
            <>
              {plan.better && !pulling && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wantBetter}
                    onChange={(e) => setWantBetter(e.target.checked)}
                  />
                  Better answers, slower: {COACH_MODELS.better.label} (
                  {gb(COACH_MODELS.better.sizeBytes)})
                </label>
              )}
              {pulling ? (
                <>
                  <Progress value={Math.round(pull.fraction * 100)} aria-label="Model download" />
                  <p data-testid="ollama-progress">
                    {Math.round(pull.fraction * 100)}% · {gb(pull.completed)} of {gb(pull.total)}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-fit"
                    onClick={cancelPull}
                    data-testid="ollama-cancel"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <p>
                    Downloads {model.label}, {gb(model.sizeBytes)}, to your Mac. Nothing from
                    SolveLab is sent.
                  </p>
                  {noRoom && (
                    <p className="text-destructive" data-testid="ollama-disk-warning">
                      Not enough free space: this needs about {gb(model.sizeBytes)} and leaves 2 GB
                      free, and your Mac has {gb(mac?.diskFreeBytes ?? 0)}.
                    </p>
                  )}
                  {pull.phase === "cancelled" && (
                    <p>Download cancelled. Press Download to continue where it left off.</p>
                  )}
                  {pull.phase === "error" && <p className="text-destructive">{pull.message}</p>}
                  <Button
                    size="sm"
                    className="w-fit"
                    disabled={noRoom}
                    onClick={() => {
                      resetPull();
                      void startPull(model);
                    }}
                    data-testid="ollama-pull"
                  >
                    <Download />{" "}
                    {pull.phase === "error" || pull.phase === "cancelled"
                      ? "Try again"
                      : "Download"}
                  </Button>
                </>
              )}
            </>
          )}
        </StepRow>

        <StepRow n={3} state={r3} title="Ready to chat" />
      </ol>
    </section>
  );
}

function Waiting({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs">
      <Spinner className="size-3" /> {children}
    </p>
  );
}

function StepRow({
  n,
  state,
  title,
  children,
}: {
  n: number;
  state: Row;
  title: string;
  children?: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[1.5rem_1fr] gap-x-3" data-state={state}>
      <span
        className={state === "done" ? "text-primary" : "text-muted-foreground"}
        aria-label={
          state === "done" ? "Done" : state === "current" ? "Current step" : "Not started"
        }
      >
        {state === "done" ? <Check className="size-5" /> : <Circle className="size-5" />}
      </span>
      <div className="grid gap-2 text-sm text-muted-foreground">
        <h3 className={state === "todo" ? "font-medium" : "font-medium text-foreground"}>
          {n}. {title}
        </h3>
        {children}
      </div>
    </li>
  );
}
