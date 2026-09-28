"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bot,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Monitor,
  Plug,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useHub } from "@/hooks/use-hub";
import { coachContext, coachPrompt, coachSystemPrompt } from "@/lib/ai/context";
import {
  completeOpenRouterSignIn,
  HAND_OFF,
  handOff,
  OLLAMA_CHAT,
  OPENROUTER_CHAT,
  OPENROUTER_KEY,
  openRouterModels,
  openRouterSignInUrl,
  ChatHttpError,
  streamChat,
  type ChatMessage,
  type HandOffTarget,
} from "@/lib/ai/providers";
import {
  API_KEY_EVENT,
  baseFor,
  checkKey,
  KeyError,
  keyErrorMessage,
  readSavedKey,
  readSavedKeyRaw,
  streamGemini,
  writeSavedKey,
} from "@/lib/ai/keys";
import { cn } from "@/lib/utils";
import { AiAnswer } from "./ai-answer";
import { ApiKeySetup, SavedKeyBar } from "./api-key-setup";

const SUGGESTIONS = [
  "What should I work on this week?",
  "Why am I slow at my weakest part, and how do I fix it?",
  "Make me a two-week practice plan.",
  "Explain my solve profile in plain words.",
];

const KEY_EVENT = "solvelab:ai-key";

function readKey(): string | null {
  try {
    return localStorage.getItem(OPENROUTER_KEY);
  } catch {
    return null;
  }
}

function writeKey(key: string | null) {
  try {
    if (key) localStorage.setItem(OPENROUTER_KEY, key);
    else localStorage.removeItem(OPENROUTER_KEY);
  } catch {
    // Storage blocked: the connection lasts only for this page.
  }
  window.dispatchEvent(new Event(KEY_EVENT));
}

function subscribeKey(onChange: () => void) {
  window.addEventListener(KEY_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(KEY_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function subscribeApiKey(onChange: () => void) {
  window.addEventListener(API_KEY_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(API_KEY_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The AI coach: ask your own AI about your solve profile. Hand-off links open
 * Claude, ChatGPT or Gemini with the question ready, on your own plan; or
 * sign in with OpenRouter, or point at a model on this computer, to chat here.
 */
export function AskAi() {
  const hub = useHub();
  const [question, setQuestion] = useState(SUGGESTIONS[0]!);
  const [showPrompt, setShowPrompt] = useState(false);

  const { profile, average, placement, current, intro } = hub;
  const context = useMemo(() => {
    if (!profile) return null;
    return coachContext({
      profile,
      averageMs: average,
      course: placement?.course ?? null,
      picks:
        current?.units
          .filter((unit) => unit.pick)
          .map((unit) => ({ title: unit.unit.title, reason: unit.pick!.reason })) ?? [],
      intro,
    });
  }, [profile, average, placement, current, intro]);

  if (!hub.loaded || !context) return <Skeleton className="h-[32rem] rounded-3xl" />;
  const prompt = coachPrompt(context, question);

  const send = async (target: HandOffTarget) => {
    const { url, paste } = handOff(target, prompt);
    if (paste) {
      try {
        await navigator.clipboard.writeText(prompt);
        toast.success(`Copied. Paste it into ${HAND_OFF[target].label}.`);
      } catch {
        toast.error("Couldn’t copy. Open “What gets sent” and copy it from there.");
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="grid grid-cols-1 gap-6" data-testid="ask-ai">
      <header>
        <p className="flex items-center gap-2 eyebrow text-primary">
          <Bot className="size-4" /> Your AI coach
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ask about your solves</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Your own AI, told what your profile shows and which packs and tests exist, so its advice
          fits you and points at things you can do here.
        </p>
      </header>

      <section className="grid gap-3 rounded-3xl p-5 glass md:p-6">
        <label htmlFor="ai-question" className="text-sm font-semibold">
          Your question
        </label>
        <Textarea
          id="ai-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          data-testid="ai-question"
        />
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <motion.button
              key={suggestion}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuestion(suggestion)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary/60",
                suggestion === question && "border-primary bg-primary/10",
              )}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowPrompt((open) => !open)}
          className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          aria-expanded={showPrompt}
          data-testid="ai-show-prompt"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform", showPrompt && "rotate-180")}
          />
          What gets sent — numbers from your profile, never your name, email or notes
        </button>
        <AnimatePresence initial={false}>
          {showPrompt ? (
            <motion.pre
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-h-72 overflow-auto rounded-xl bg-background/60 p-3 text-xs whitespace-pre-wrap"
              data-testid="ai-prompt"
            >
              {prompt}
            </motion.pre>
          ) : null}
        </AnimatePresence>
      </section>

      <ChatHere systemPrompt={coachSystemPrompt(context)} question={question} />

      <section className="grid gap-3" aria-labelledby="ai-subscription">
        <div>
          <h2 id="ai-subscription" className="text-base font-semibold">
            Or open it in your own AI app
          </h2>
          <p className="text-sm text-muted-foreground">
            Opens your AI with the question and your data ready. You sign in there as usual, it runs
            on your own plan, and you can check the message before sending.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(HAND_OFF) as HandOffTarget[]).map((target, index) => (
            <motion.button
              key={target}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void send(target)}
              data-testid={`ai-open-${target}`}
              className="flex items-center gap-3 rounded-2xl p-4 text-left glass"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <ExternalLink className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">Ask {HAND_OFF[target].label}</span>
                <span className="block text-xs text-muted-foreground">
                  {HAND_OFF[target].plan}
                  {target === "gemini" ? " · copies the question for you to paste" : ""}
                </span>
              </span>
            </motion.button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() =>
            void navigator.clipboard
              .writeText(prompt)
              .then(() => toast.success("Copied."))
              .catch(() => toast.error("Couldn’t copy."))
          }
        >
          <Copy /> Copy it for any other AI
        </Button>
      </section>

      <section className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Plug className="size-4" /> Coming: SolveLab inside Claude and ChatGPT
        </p>
        <p className="mt-1">
          A connector will let Claude and ChatGPT read your profile directly while you chat there,
          on your own subscription. Claude and ChatGPT don&apos;t let other websites sign in with
          your subscription, so this — and the buttons above — are the supported ways to use it.
        </p>
      </section>
    </div>
  );
}

type Provider = "key" | "openrouter" | "local";

const PROVIDER_LABELS: Record<Provider, string> = {
  key: "Your API key",
  openrouter: "OpenRouter",
  local: "On this computer",
};

function ChatHere({ systemPrompt, question }: { systemPrompt: string; question: string }) {
  const key = useSyncExternalStore(subscribeKey, readKey, () => null);
  const savedRaw = useSyncExternalStore(subscribeApiKey, readSavedKeyRaw, () => null);
  // Parsed from the raw text, so it only changes when the stored key does.
  const saved = useMemo(() => (savedRaw ? readSavedKey() : null), [savedRaw]);
  const [keyModels, setKeyModels] = useState<string[]>([]);
  // Your own pick, or else whichever is already connected: a saved key first.
  const [chosen, setProvider] = useState<Provider | null>(null);
  const provider: Provider = chosen ?? (saved ? "key" : key ? "openrouter" : "key");
  const [localModel, setLocalModel] = useState("llama3.2");
  const [models, setModels] = useState<string[]>(["openrouter/auto"]);
  const [model, setModel] = useState("openrouter/auto");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const abort = useRef<AbortController | null>(null);
  const connected =
    provider === "local" ||
    (provider === "openrouter" && Boolean(key)) ||
    (provider === "key" && Boolean(saved));

  // Finish a sign-in that came back to this page, then tidy the address.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    history.replaceState(null, "", window.location.pathname);
    void completeOpenRouterSignIn(code).then((received) => {
      if (received) {
        writeKey(received);
        toast.success("Connected to OpenRouter.");
      } else {
        toast.error("That sign-in didn’t finish. Try again from this page.");
      }
    });
  }, []);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    void openRouterModels().then((list) => {
      if (!cancelled) setModels(list);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // The models a saved key can use, for the picker.
  useEffect(() => {
    if (!saved) return;
    let cancelled = false;
    void checkKey(saved)
      .then((list) => {
        if (!cancelled) setKeyModels(list);
      })
      .catch(() => {
        // The chat itself will say what's wrong if the key stopped working.
      });
    return () => {
      cancelled = true;
    };
  }, [saved]);

  const signIn = async () => {
    window.location.assign(await openRouterSignInUrl(`${window.location.origin}/hub/ask/`));
  };

  const ask = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    const onText = (piece: string) =>
      setMessages((current) => {
        const next = [...current];
        const last = next.at(-1)!;
        next[next.length - 1] = { ...last, content: last.content + piece };
        return next;
      });
    try {
      if (provider === "key" && saved?.provider === "gemini") {
        await streamGemini(saved, systemPrompt, history, onText, controller.signal);
      } else {
        await streamChat(
          provider === "local"
            ? { url: OLLAMA_CHAT, key: "", model: localModel }
            : provider === "key" && saved
              ? { url: `${baseFor(saved)}/chat/completions`, key: saved.key, model: saved.model }
              : { url: OPENROUTER_CHAT, key: key ?? "", model },
          [{ role: "system", content: systemPrompt }, ...history],
          onText,
          controller.signal,
        );
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        toast.error(
          provider === "local"
            ? "Couldn’t reach a model on this computer. Is Ollama running, with this site allowed?"
            : error instanceof KeyError
              ? error.message
              : provider === "key" && saved && error instanceof ChatHttpError
                ? keyErrorMessage(saved.provider, error.status)
                : error instanceof Error
                  ? error.message
                  : "The AI didn’t answer.",
        );
        setMessages((current) => (current.at(-1)?.content === "" ? current.slice(0, -1) : current));
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  };

  return (
    <section
      className="grid gap-3 rounded-3xl p-5 glass md:p-6"
      aria-labelledby="ai-chat"
      data-testid="ai-chat"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ai-chat" className="text-base font-semibold">
            Chat here
          </h2>
          <p className="text-sm text-muted-foreground">
            Chat on this page with your own AI key — a free Google Gemini key works well — or sign
            in with OpenRouter, or use a model running on this computer.
          </p>
        </div>
        <div className="inline-flex rounded-full border p-0.5 text-xs">
          {(["key", "openrouter", "local"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setProvider(item)}
              aria-pressed={provider === item}
              data-testid={`ai-provider-${item}`}
              className={cn(
                "rounded-full px-3 py-1",
                provider === item && "bg-primary text-primary-foreground",
              )}
            >
              {PROVIDER_LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      {provider === "key" ? (
        saved ? (
          <SavedKeyBar
            saved={saved}
            models={keyModels}
            onModel={(next) => writeSavedKey({ ...saved, model: next })}
            onRemove={() => {
              // Stay here so a new key can go straight in.
              setProvider("key");
              writeSavedKey(null);
            }}
          />
        ) : (
          <ApiKeySetup />
        )
      ) : provider === "local" ? (
        <div className="grid gap-2 rounded-xl bg-background/40 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Monitor className="size-4" /> A model running on this computer
          </p>
          <p className="text-muted-foreground">
            Uses Ollama at localhost:11434. Start it with this site allowed (set OLLAMA_ORIGINS to
            this address), and nothing leaves your computer.
          </p>
          <label className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Model</span>
            <input
              value={localModel}
              onChange={(event) => setLocalModel(event.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            />
          </label>
        </div>
      ) : !key ? (
        <div className="flex flex-wrap items-center gap-3">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              className="rounded-full"
              onClick={() => void signIn()}
              data-testid="ai-signin-openrouter"
            >
              <Sparkles /> Sign in with OpenRouter
            </Button>
          </motion.div>
          <p className="text-xs text-muted-foreground">
            You approve on openrouter.ai. SolveLab never sees your password; the connection is kept
            on this device only.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span
            className="rounded-full bg-[var(--known)]/15 px-2.5 py-0.5 text-xs font-medium"
            data-testid="ai-connected"
          >
            Connected to OpenRouter
          </span>
          <label className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Model</span>
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="max-w-56 rounded-md border bg-background px-2 py-1 text-xs"
              data-testid="ai-model"
            >
              {models.map((id) => (
                <option key={id} value={id}>
                  {id === "openrouter/auto" ? "Let OpenRouter choose" : id}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Stay on OpenRouter so signing in again is one click away.
              setProvider("openrouter");
              writeKey(null);
            }}
            data-testid="ai-disconnect"
          >
            <LogOut /> Disconnect
          </Button>
        </div>
      )}

      {connected ? (
        <>
          <div className="grid gap-3" aria-live="polite" data-testid="ai-messages">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "max-w-[90%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-background/60",
                )}
              >
                {message.role === "assistant" ? (
                  message.content ? (
                    <AiAnswer text={message.content} />
                  ) : (
                    <span className="flex gap-1" aria-label="Thinking">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          className="size-2 rounded-full bg-muted-foreground"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                        />
                      ))}
                    </span>
                  )
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </motion.div>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(messages.length ? draft : draft || question);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={messages.length ? "Ask a follow-up" : question}
              className="min-w-0 flex-1 rounded-full border bg-background/60 px-4 py-2 text-sm"
              aria-label="Message the AI coach"
              data-testid="ai-input"
            />
            {busy ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => abort.current?.abort()}
              >
                <Square /> Stop
              </Button>
            ) : (
              <Button type="submit" className="rounded-full" data-testid="ai-send">
                <Send /> Ask
              </Button>
            )}
          </form>
        </>
      ) : null}
    </section>
  );
}
