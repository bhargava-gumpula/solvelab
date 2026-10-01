/*
 * The guess you made on the Next up card, remembered per question (this
 * browser only, a UI preference key), so the lesson's own Quick check can call
 * back to it instead of asking the same question cold.
 */
const KEY = "solvelab.draft.guesses";

const keyOf = (lessonId: string, question: string) => `${lessonId}::${question}`;

function read(): Record<string, number> {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as unknown;
    return value && typeof value === "object" ? (value as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function rememberGuess(lessonId: string, question: string, choice: number) {
  try {
    const all = read();
    all[keyOf(lessonId, question)] = choice;
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Private mode or storage full: the callback is a nicety.
  }
}

export function recallGuess(lessonId: string, question: string): number | null {
  if (typeof window === "undefined") return null;
  const choice = read()[keyOf(lessonId, question)];
  return typeof choice === "number" ? choice : null;
}
