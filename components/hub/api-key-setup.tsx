"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ExternalLink, KeyRound, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  checkKey,
  KeyError,
  KEY_PROVIDERS,
  writeSavedKey,
  type KeyProvider,
  type SavedKey,
} from "@/lib/ai/keys";
import { cn } from "@/lib/utils";

const ORDER: KeyProvider[] = ["gemini", "groq", "openai", "mistral", "custom"];

/**
 * Setting up a key: pick a provider, follow three steps for a free Gemini key,
 * paste it, and it's checked against the provider before it's saved.
 */
export function ApiKeySetup() {
  const [provider, setProvider] = useState<KeyProvider>("gemini");
  const [key, setKey] = useState("");
  const [base, setBase] = useState("");
  const [model, setModel] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const info = KEY_PROVIDERS[provider];

  const save = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setChecking(true);
    setError(null);
    try {
      const candidate = { provider, key: trimmed, ...(provider === "custom" ? { base } : {}) };
      const models = await checkKey(candidate);
      const chosen =
        model.trim() ||
        (models.includes(info.defaultModel) ? info.defaultModel : (models[0] ?? info.defaultModel));
      const saved: SavedKey = { ...candidate, model: chosen };
      writeSavedKey(saved);
      toast.success(`Key saved. Chatting with ${info.label}.`);
    } catch (reason) {
      setError(reason instanceof KeyError ? reason.message : "That key couldn't be checked.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="grid gap-4" data-testid="api-key-setup">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Provider">
        {ORDER.map((id) => (
          <motion.button
            key={id}
            type="button"
            role="radio"
            aria-checked={provider === id}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setProvider(id);
              setError(null);
            }}
            data-testid={`key-provider-${id}`}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              provider === id
                ? "border-primary bg-primary/15"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {KEY_PROVIDERS[id].label}
            {id === "gemini" ? <span className="ml-1 text-primary">· free</span> : null}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={provider}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="grid gap-3"
        >
          {provider === "gemini" ? (
            <ol className="grid gap-2 text-sm" data-testid="gemini-steps">
              <Step n={1}>
                Open{" "}
                <a
                  href={info.keyUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4"
                >
                  Google AI Studio <ExternalLink className="size-3" />
                </a>{" "}
                and sign in with a Google account.
              </Step>
              <Step n={2}>Click “Create API key”. It&apos;s free and needs no card.</Step>
              <Step n={3}>Copy the key and paste it below.</Step>
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">
              {info.note}
              {info.keyUrl ? (
                <>
                  {" "}
                  <a
                    href={info.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
                  >
                    Get a key <ExternalLink className="size-3" />
                  </a>
                </>
              ) : null}
            </p>
          )}

          {provider === "custom" ? (
            <input
              value={base}
              onChange={(event) => setBase(event.target.value)}
              placeholder="https://your-provider.example/v1"
              className="rounded-xl border bg-background/60 px-3 py-2 text-sm"
              aria-label="Base URL"
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            <label className="relative min-w-0 flex-1">
              <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={key}
                onChange={(event) => setKey(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void save();
                }}
                placeholder={`Paste your ${info.label} key`}
                className="w-full rounded-xl border bg-background/60 py-2 pr-3 pl-9 text-sm"
                aria-label={`${info.label} API key`}
                data-testid="api-key-input"
              />
            </label>
            {provider === "custom" ? (
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="Model name"
                className="w-40 rounded-xl border bg-background/60 px-3 py-2 text-sm"
                aria-label="Model"
              />
            ) : null}
            <Button
              className="rounded-full"
              onClick={() => void save()}
              disabled={!key.trim() || checking || (provider === "custom" && !base.trim())}
              data-testid="api-key-save"
            >
              {checking ? <Loader2 className="animate-spin" /> : <Check />}
              {checking ? "Checking…" : "Save and check"}
            </Button>
          </div>
          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: [0, -6, 6, 0] }}
              className="rounded-xl bg-destructive/10 p-3 text-sm"
              role="alert"
              data-testid="api-key-error"
            >
              {error}
            </motion.p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <ul className="grid gap-1 text-xs text-muted-foreground">
        <li>
          Your key stays in this browser only. SolveLab never stores it on its servers, syncs it or
          backs it up, and it goes when you sign out or remove it.
        </li>
        <li>
          It&apos;s sent only to the provider it belongs to, with your question and your profile
          numbers.
        </li>
        {provider === "gemini" ? (
          <>
            <li>Google requires you to be 18 or older to use its API.</li>
            <li>
              On the free tier, Google may use what you send to improve its products (not in the EU,
              UK or Switzerland). SolveLab sends numbers from your profile, never your name or
              email.
            </li>
          </>
        ) : null}
      </ul>
    </div>
  );
}

/** The saved key: which provider, which model, and a way to remove it. */
export function SavedKeyBar({
  saved,
  models,
  onModel,
}: {
  saved: SavedKey;
  models: string[];
  onModel: (model: string) => void;
}) {
  const options = models.includes(saved.model) ? models : [saved.model, ...models];
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span
        className="rounded-full bg-[var(--known)]/15 px-2.5 py-0.5 text-xs font-medium"
        data-testid="api-key-connected"
      >
        Using your {KEY_PROVIDERS[saved.provider].label} key
      </span>
      <label className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Model</span>
        <select
          value={saved.model}
          onChange={(event) => onModel(event.target.value)}
          className="max-w-56 rounded-md border bg-background px-2 py-1 text-xs"
          data-testid="api-key-model"
        >
          {options.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => writeSavedKey(null)}
        data-testid="api-key-remove"
      >
        <Trash2 /> Remove key
      </Button>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
