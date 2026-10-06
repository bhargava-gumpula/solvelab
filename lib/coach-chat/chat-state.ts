/**
 * The state of one chat with the local coach, as a reducer, so the rules
 * (one reply at a time, what Stop and an error leave behind) are tested
 * without a screen. Replies are kept as the raw JSON the model sent: that is
 * what goes back to it as history.
 */
import type { CoachChatMessage } from "@/types/domain";
import type { OllamaErrorCode } from "./ollama";
import type { ChatMessage } from "./types";

export type ChatPhase = "idle" | "streaming" | "error";

export interface ChatError {
  code: OllamaErrorCode | "unknown";
  message: string;
}

export interface ChatState {
  chatId: string;
  messages: CoachChatMessage[];
  phase: ChatPhase;
  error: ChatError | null;
}

export type ChatAction =
  | { type: "open"; chatId: string; messages?: CoachChatMessage[] }
  | { type: "send"; text: string }
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "stop"; cut?: boolean }
  | { type: "fail"; error: ChatError }
  | { type: "retry" };

export const MAX_QUESTION_CHARS = 1000;
/** Most recent messages sent back to the model, so history plus the prompt stays inside the 8K context. */
export const MAX_HISTORY_MESSAGES = 16;

export function initialChat(chatId: string, messages: CoachChatMessage[] = []): ChatState {
  return { chatId, messages, phase: "idle", error: null };
}

const dropLast = (messages: CoachChatMessage[]) => messages.slice(0, -1);

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  const last = state.messages.at(-1);
  switch (action.type) {
    case "open":
      return initialChat(action.chatId, action.messages);
    case "send": {
      const text = action.text.trim().slice(0, MAX_QUESTION_CHARS);
      if (!text || state.phase === "streaming") return state;
      return {
        ...state,
        phase: "streaming",
        error: null,
        messages: [
          ...state.messages,
          { role: "user", content: text },
          { role: "assistant", content: "" },
        ],
      };
    }
    case "chunk":
      if (state.phase !== "streaming" || last?.role !== "assistant") return state;
      return {
        ...state,
        messages: [...dropLast(state.messages), { ...last, content: last.content + action.text }],
      };
    case "done":
      return state.phase === "streaming" ? { ...state, phase: "idle" } : state;
    case "stop":
      if (state.phase !== "streaming" || last?.role !== "assistant") return state;
      // Nothing arrived yet: there is no reply to keep. Otherwise keep what came, marked.
      return {
        ...state,
        phase: "idle",
        messages: last.content
          ? [
              ...dropLast(state.messages),
              { ...last, stopped: true, ...(action.cut ? { cut: true } : {}) },
            ]
          : dropLast(state.messages),
      };
    case "fail":
      if (state.phase !== "streaming") return state;
      // A reply cut off by an error is not kept; the question stays, ready to try again.
      return {
        ...state,
        phase: "error",
        error: action.error,
        messages: last?.role === "assistant" ? dropLast(state.messages) : state.messages,
      };
    case "retry":
      if (state.phase !== "error" || last?.role !== "user") return state;
      return {
        ...state,
        phase: "streaming",
        error: null,
        messages: [...state.messages, { role: "assistant", content: "" }],
      };
  }
}

/**
 * What goes to the model: the system message, then the latest messages. A reply
 * that was stopped or is empty is left out (half a JSON object would only confuse it).
 */
export function toModelMessages(
  system: string,
  messages: readonly CoachChatMessage[],
): ChatMessage[] {
  const kept = messages.filter(
    (message) => message.role === "user" || (message.content && !message.stopped),
  );
  return [
    { role: "system", content: system },
    ...kept.slice(-MAX_HISTORY_MESSAGES).map(({ role, content }) => ({ role, content })),
  ];
}

/** A chat's title: its first question, shortened. */
export function chatTitle(messages: readonly CoachChatMessage[]): string {
  const first = messages.find((message) => message.role === "user")?.content ?? "New chat";
  return first.length > 60 ? `${first.slice(0, 59).trimEnd()}…` : first;
}
