import { coachContext, type CoachContextInput } from "./context";

/**
 * What "Copy my summary" puts on the clipboard: the same numbers-only summary
 * the Mac app's coach is told, with a one-line opener so it makes sense pasted
 * into any AI. Never a name, email, notes, scrambles or raw solves.
 */
export function profileSummary(input: CoachContextInput): string {
  return ["My speedcubing profile from SolveLab (numbers only):", "", coachContext(input)].join(
    "\n",
  );
}
