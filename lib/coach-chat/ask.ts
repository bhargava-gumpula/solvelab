import type { CoachChatMessage } from "@/types/domain";
import { toModelMessages } from "./chat-state";
import { OllamaError, streamOllamaChat, type OllamaErrorCode } from "./ollama";
import { COACH_REPLY_SCHEMA } from "./reply";

/** The settings the eval passes (plan 3.3), so the app and the eval see the same behaviour. */
export const COACH_CHAT_OPTIONS = {
  numPredict: 700,
  temperature: 0.2,
  keepAlive: "30m",
  format: COACH_REPLY_SCHEMA,
} as const;

export type AskResult =
  | { ok: true; raw: string; stopped: boolean; cut: boolean }
  | { ok: false; code: OllamaErrorCode | "unknown"; message: string };

/**
 * Sends the conversation to the local model and hands every piece of the reply
 * to `onText` as it arrives. Aborting `signal` ends it quietly with `stopped`.
 * Never throws: a failure comes back as `ok: false`.
 */
export async function askCoach(input: {
  system: string;
  messages: readonly CoachChatMessage[];
  model: string;
  signal: AbortSignal;
  onText: (piece: string) => void;
}): Promise<AskResult> {
  let raw = "";
  try {
    const stream = streamOllamaChat(toModelMessages(input.system, input.messages), {
      model: input.model,
      signal: input.signal,
      ...COACH_CHAT_OPTIONS,
    });
    // Manual loop: `for await` drops the generator's return value, which carries done_reason.
    let step = await stream.next();
    while (!step.done) {
      raw += step.value;
      input.onText(step.value);
      step = await stream.next();
    }
    // "length" means the reply hit numPredict mid-sentence: never present it as finished.
    const cut = !input.signal.aborted && step.value?.doneReason === "length";
    return { ok: true, raw, stopped: input.signal.aborted, cut };
  } catch (error) {
    if (error instanceof OllamaError)
      return { ok: false, code: error.code, message: error.message };
    return { ok: false, code: "unknown", message: error instanceof Error ? error.message : "" };
  }
}
