/**
 * Questions the chat can open with. The links into the chat carry a short key
 * (never the question's text, never a number from the profile), and the page
 * turns it into the question, so the address holds nothing about the person.
 */
import { isTestId, testTitle } from "@/data/exercises";

export const ASK_HREF = "/hub/ask/";

export type Starter = { key: "profile" } | { key: "test"; testId: string };

export function starterHref(starter: Starter): string {
  const params = new URLSearchParams({ starter: starter.key });
  if (starter.key === "test") params.set("test", starter.testId);
  return `${ASK_HREF}?${params}`;
}

/** The question for `?starter=…&test=…`, or null when the key isn't one of ours. */
export function starterQuestion(starter: string | null, testId: string | null): string | null {
  if (starter === "profile") return "What should I work on first, based on my solve profile?";
  if (starter === "test" && testId && isTestId(testId))
    return `What does my ${testTitle(testId)} result say, and what should I do about it?`;
  return null;
}

/** Shown on an empty chat. */
export const SUGGESTED_QUESTIONS = [
  "What should I work on this week?",
  "Why am I slow at my weakest part, and how do I fix it?",
  "Explain my solve profile in plain words.",
] as const;
