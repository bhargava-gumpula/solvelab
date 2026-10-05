"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Bot, History, MessageSquarePlus, Send, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CoachReplyView } from "@/components/coach/coach-reply";
import { useStorageStatus } from "@/components/layout/storage-provider";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Message, MessageContent } from "@/components/ui/message";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCoachSystem } from "@/hooks/use-coach-context";
import { askCoach } from "@/lib/coach-chat/ask";
import {
  chatReducer,
  chatTitle,
  initialChat,
  MAX_QUESTION_CHARS,
  type ChatError,
} from "@/lib/coach-chat/chat-state";
import { ollamaStatus } from "@/lib/coach-chat/ollama";
import { partialAnswer } from "@/lib/coach-chat/reply";
import {
  COACH_MODEL,
  MIN_OLLAMA_VERSION,
  readiness,
  type Readiness,
} from "@/lib/coach-chat/readiness";
import { starterQuestion, SUGGESTED_QUESTIONS } from "@/lib/coach-chat/starters";
import { getRepositories } from "@/lib/storage";
import { createId } from "@/lib/storage/ids";
import type { CoachChat, CoachChatMessage } from "@/types/domain";

/** The AI coach on the Mac app: a chat with a model running on this Mac. */
export function CoachChat() {
  const params = useSearchParams();
  const starter = starterQuestion(params.get("starter"), params.get("test"));
  const storage = useStorageStatus().status;
  const saved = useLiveQuery(
    async () => (storage === "ready" ? await getRepositories().coachChats.list() : undefined),
    [storage],
  );
  const chats = storage === "error" ? [] : saved;
  if (!chats)
    return <Skeleton className="h-[32rem] rounded-3xl" data-testid="coach-chat-loading" />;
  return <ChatBody saved={chats} starter={starter} />;
}

const PROBLEMS: Record<Exclude<Readiness, "ready">, { title: string; body: React.ReactNode }> = {
  "not-running": {
    title: "Ollama isn’t running",
    body: (
      <>
        The coach runs on Ollama, a program on this Mac. Open the Ollama app, then check again. If
        it isn’t installed, download it from ollama.com/download.
      </>
    ),
  },
  "old-version": {
    title: "Your Ollama is too old",
    body: (
      <>The coach needs Ollama {MIN_OLLAMA_VERSION} or newer. Update Ollama, then check again.</>
    ),
  },
  "model-missing": {
    title: "The coach’s model isn’t downloaded",
    body: (
      <>
        Download it by running <code className="font-mono">ollama pull {COACH_MODEL}</code> in
        Terminal, then check again.
      </>
    ),
  },
};

function errorText(error: ChatError): string {
  switch (error.code) {
    case "not-running":
      return "Lost the connection to Ollama.";
    case "model-missing":
      return "Ollama doesn’t have the coach’s model.";
    case "old-version":
      return "This version of Ollama can’t run the coach’s model.";
    case "out-of-memory":
      return "This Mac ran out of memory loading the model. Close some apps and try again.";
    case "bad-stream":
      return "The reply was cut short.";
    default:
      return error.message || "Something went wrong.";
  }
}

function ChatBody({ saved, starter }: { saved: CoachChat[]; starter: string | null }) {
  const system = useCoachSystem();
  // A starter question opens a fresh chat; otherwise the latest saved chat carries on.
  const [chat, dispatch] = useReducer(chatReducer, undefined, () => {
    const latest = starter ? undefined : saved[0];
    return latest ? initialChat(latest.id, latest.messages) : initialChat(createId());
  });
  const [draft, setDraft] = useState(starter ?? "");
  const [status, setStatus] = useState<Readiness | "checking">("checking");
  const abortRef = useRef<AbortController | null>(null);
  // Chats the person deleted: a reply still arriving for one must not bring it back.
  const deletedRef = useRef(new Set<string>());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    void ollamaStatus().then((found) => live && setStatus(readiness(found)));
    return () => {
      live = false;
    };
  }, []);

  // Leaving the page (to the Timer, say) ends the reply: nothing keeps generating behind it.
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const count = chat.messages.length;
  useEffect(() => {
    if (count) endRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [count]);

  const check = () => {
    setStatus("checking");
    void ollamaStatus().then((found) => setStatus(readiness(found)));
  };

  const save = async (chatId: string, messages: CoachChatMessage[]) => {
    try {
      await getRepositories().coachChats.save({
        id: chatId,
        title: chatTitle(messages),
        model: COACH_MODEL,
        messages,
      });
    } catch {
      toast.error("Couldn’t save this chat on your Mac.");
    }
  };

  /** Asks the model about `messages` (ending in the question) and keeps the reply as it arrives. */
  const run = async (messages: CoachChatMessage[], chatId: string) => {
    if (!system) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const result = await askCoach({
      system,
      messages,
      model: COACH_MODEL,
      signal: controller.signal,
      // Text from a chat the person has already left is dropped.
      onText: (text) => {
        if (abortRef.current === controller) dispatch({ type: "chunk", text });
      },
    });
    // False when the person moved to another chat while this one was still going.
    const current = abortRef.current === controller;
    if (current) abortRef.current = null;
    if (!result.ok) {
      if (!current) return;
      dispatch({ type: "fail", error: { code: result.code, message: result.message } });
      if (
        result.code === "not-running" ||
        result.code === "model-missing" ||
        result.code === "old-version"
      )
        setStatus(result.code);
      return;
    }
    // A reply with nothing to show would leave the thinking dots up for good.
    if (!result.stopped && !partialAnswer(result.raw).trim()) {
      if (current) {
        dispatch({
          type: "fail",
          error: { code: "unknown", message: "The coach sent an empty reply." },
        });
      }
      return;
    }
    if (current) dispatch({ type: result.stopped ? "stop" : "done" });
    if (result.raw && !deletedRef.current.has(chatId)) {
      const reply: CoachChatMessage = { role: "assistant", content: result.raw };
      await save(chatId, [...messages, result.stopped ? { ...reply, stopped: true } : reply]);
    }
  };

  const send = (text: string) => {
    if (status !== "ready" || !system) return;
    const action = { type: "send", text } as const;
    const next = chatReducer(chat, action);
    if (next === chat) return;
    dispatch(action);
    inputRef.current?.focus();
    void run(next.messages.slice(0, -1), chat.chatId);
  };

  const retry = () => {
    const next = chatReducer(chat, { type: "retry" });
    if (next === chat) return;
    dispatch({ type: "retry" });
    inputRef.current?.focus();
    void run(next.messages.slice(0, -1), chat.chatId);
  };

  const stop = () => {
    abortRef.current?.abort();
    inputRef.current?.focus();
  };

  const open = (id: string, messages: CoachChatMessage[] = []) => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "open", chatId: id, messages });
    setDraft("");
    inputRef.current?.focus();
  };

  const remove = async (id: string) => {
    const isCurrent = id === chat.chatId;
    // Marked first, so a reply that finishes while the delete is under way can't save it again.
    if (isCurrent) deletedRef.current.add(id);
    try {
      await getRepositories().coachChats.delete(id);
    } catch {
      if (isCurrent) deletedRef.current.delete(id);
      toast.error("Couldn’t delete that chat.");
      return;
    }
    if (isCurrent) open(createId());
  };

  const streaming = chat.phase === "streaming";
  // The reply being written (and the question it answers) stays out of the live log until it is
  // finished, so a screen reader hears whole replies and never a word at a time.
  const settled = streaming ? chat.messages.slice(0, -2) : chat.messages;
  const pending = streaming ? chat.messages.slice(-2) : [];
  const latestReply = chat.messages.findLastIndex((message) => message.role === "assistant");
  const canSend = status === "ready" && system !== null && !streaming && draft.trim() !== "";
  const problem = status !== "ready" && status !== "checking" ? PROBLEMS[status] : null;
  const stopped = !streaming && chat.messages.at(-1)?.stopped;

  const row = (message: CoachChatMessage, index: number, offset: number) => (
    <MessageRow
      key={offset + index}
      message={message}
      unfinished={streaming && offset + index === chat.messages.length - 1}
      onFollowUp={
        chat.phase === "idle" && offset + index === latestReply ? (text) => send(text) : undefined
      }
    />
  );

  return (
    <div className="grid gap-5" data-testid="coach-chat">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 eyebrow text-primary">
            <Bot className="size-4" aria-hidden /> AI coach
          </p>
          <h1 className="mt-1 font-display text-[2.9rem] leading-[0.98]">Your AI coach</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Runs on this Mac. Your questions and the numbers from your profile never leave it.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => open(createId())}
          disabled={count === 0 && !streaming}
          data-testid="coach-chat-new"
        >
          <MessageSquarePlus /> New chat
        </Button>
      </header>

      {status === "checking" ? (
        <p className="text-sm text-muted-foreground" role="status">
          Checking that Ollama is running…
        </p>
      ) : problem ? (
        <section
          className="tile grid gap-2 p-5 md:p-6"
          aria-labelledby="coach-problem"
          data-testid="coach-chat-problem"
          data-problem={status}
        >
          <h2 id="coach-problem" className="text-base font-semibold">
            {problem.title}
          </h2>
          <p className="text-sm text-muted-foreground">{problem.body}</p>
          <Button variant="outline" className="w-fit" onClick={check}>
            Check again
          </Button>
        </section>
      ) : null}

      <section
        className="tile grid gap-4 p-4 md:p-6"
        aria-label="Chat with your coach"
        data-testid="coach-chat-panel"
      >
        {count === 0 ? (
          <div className="grid gap-3" data-testid="coach-chat-empty">
            <p className="text-sm text-muted-foreground">
              Ask about your solve profile: what to work on, why a part is slow, what a result
              means. It only knows what’s in your profile and SolveLab’s packs and tests.
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Questions to start with">
              {SUGGESTED_QUESTIONS.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => send(question)}
                    disabled={status !== "ready" || !system}
                    className="rounded-full border px-3 py-1 text-left text-xs transition-colors hover:border-primary/60 hover:bg-primary/10 disabled:opacity-50"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div
          role="log"
          aria-label="Conversation"
          aria-live="polite"
          aria-relevant="additions"
          className="grid gap-4 empty:hidden"
          data-testid="coach-chat-log"
        >
          {settled.map((message, index) => row(message, index, 0))}
        </div>
        {pending.length ? (
          <div aria-hidden="true" className="grid gap-4" data-testid="coach-chat-pending">
            {pending.map((message, index) => row(message, index, settled.length))}
          </div>
        ) : null}
        <p role="status" className="sr-only" data-testid="coach-chat-announce">
          {streaming ? "The coach is thinking." : stopped ? "Stopped." : ""}
        </p>

        {chat.phase === "error" && chat.error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
            data-testid="coach-chat-error"
          >
            <span className="flex-1">{errorText(chat.error)}</span>
            <Button size="sm" variant="outline" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : null}

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSend) return;
            send(draft);
            setDraft("");
          }}
        >
          <label htmlFor="coach-chat-input" className="sr-only">
            Ask your coach
          </label>
          <Textarea
            id="coach-chat-input"
            ref={inputRef}
            rows={2}
            value={draft}
            maxLength={MAX_QUESTION_CHARS}
            placeholder={count ? "Ask a follow-up" : "Ask about your solve profile"}
            className="min-h-0 flex-1"
            data-testid="coach-chat-input"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // WebKit reports the Enter that confirms an IME choice as keyCode 229 after composition ends.
              if (
                event.key !== "Enter" ||
                event.shiftKey ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              )
                return;
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }}
          />
          {streaming ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={stop}
              data-testid="coach-chat-stop"
            >
              <Square /> Stop
            </Button>
          ) : (
            <Button
              type="submit"
              className="rounded-full"
              disabled={!canSend}
              data-testid="coach-chat-send"
            >
              <Send /> Ask
            </Button>
          )}
        </form>
        {status === "ready" && !system ? (
          <p className="text-xs text-muted-foreground">Reading your profile…</p>
        ) : null}
        <div ref={endRef} />
      </section>

      {saved.length ? (
        <details className="tile p-4 md:p-5" data-testid="coach-chat-history">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <History className="size-4 text-primary" aria-hidden /> Earlier chats ({saved.length})
          </summary>
          <ul className="mt-3 grid gap-1.5">
            {saved.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => open(item.id, item.messages)}
                  aria-current={item.id === chat.chatId ? "true" : undefined}
                  className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm hover:bg-primary/10 aria-[current=true]:bg-primary/10"
                >
                  <span className="block truncate">{item.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete chat: ${item.title}`}
                  onClick={() => void remove(item.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="px-1 text-xs text-muted-foreground">
        A small model on your Mac can be wrong about cubing. Check anything surprising, and take
        algorithms only from the algorithm bank. Chats are kept only on this Mac.
      </p>
    </div>
  );
}

function MessageRow({
  message,
  unfinished,
  onFollowUp,
}: {
  message: CoachChatMessage;
  unfinished: boolean;
  onFollowUp?: (question: string) => void;
}) {
  if (message.role === "user") {
    return (
      <Message align="end">
        <MessageContent>
          <Bubble variant="default" align="end">
            <BubbleContent className="whitespace-pre-wrap">
              <span className="sr-only">You: </span>
              {message.content}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    );
  }
  return (
    <Message>
      <MessageContent>
        <Bubble variant="muted" className="max-w-full sm:max-w-[92%]">
          <BubbleContent className="p-4">
            <span className="sr-only">Coach: </span>
            {message.content ? (
              <CoachReplyView
                raw={message.content}
                unfinished={unfinished || message.stopped === true}
                onFollowUp={onFollowUp}
              />
            ) : (
              <span className="flex gap-1 py-1" data-testid="coach-chat-thinking">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="size-2 rounded-full bg-muted-foreground motion-safe:animate-pulse"
                    style={{ animationDelay: `${dot * 0.2}s` }}
                  />
                ))}
              </span>
            )}
            {message.stopped ? (
              <p className="mt-2 text-xs text-muted-foreground">Stopped.</p>
            ) : null}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
